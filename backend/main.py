from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from datetime import datetime, timedelta
from typing import List, Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configurações
DATABASE_URL = "sqlite:///./database.db"
SECRET_KEY = "secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Modelos
class Aluno(Base):
    __tablename__ = "alunos"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    contato = Column(String)
    telefone = Column(String)
    forma_pagamento = Column(String)
    fim_plano = Column(DateTime, nullable=True)
    data_matricula = Column(DateTime, default=datetime.utcnow)
    pagamentos = relationship("Pagamento", back_populates="aluno")
    valor_mensalidade = Column(Integer, nullable=True)

class AlunoCreate(BaseModel):
    nome: str
    contato: str
    telefone: str
    forma_pagamento: str
    data_matricula: Optional[datetime] = datetime.utcnow
    fim_plano: Optional[datetime] = None
    valor_mensalidade: int

class LoginData(BaseModel):
    username: str
    password: str

class Pagamento(Base):
    __tablename__ = "pagamentos"
    id = Column(Integer, primary_key=True, index=True)
    aluno_id = Column(Integer, ForeignKey("alunos.id"))
    data_pagamento = Column(DateTime, default=datetime.utcnow)
    periodo = Column(String)
    aluno = relationship("Aluno", back_populates="pagamentos")

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Token(BaseModel):
    access_token: str
    token_type: str

# Criar tabelas
Base.metadata.create_all(bind=engine)

# Dependência para obter sessão do banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user(db, username=username)
    if user is None:
        raise credentials_exception
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_user(db, username: str):
    return db.query(Usuario).filter(Usuario.username == username).first()

def authenticate_user(db, username: str, password: str):
    user = get_user(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir qualquer origem (para desenvolvimento)
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos os métodos (GET, POST, etc.)
    allow_headers=["*"],  # Permitir todos os headers
)

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Usuário ou senha incorretos")
    access_token = create_access_token({"sub": user.username}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login/", response_model=Token)
async def login(form_data: LoginData, db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Usuário ou senha incorretos")
    access_token = create_access_token(
        data={"sub": user.username}, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/usuarios/")
def criar_usuario(username: str, password: str, db: Session = Depends(get_db)):
    # Verificar se o usuário já existe
    existing_user = get_user(db, username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Nome de usuário já registrado")
    
    hashed_password = get_password_hash(password)
    user = Usuario(username=username, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"username": user.username}

@app.get("/alunos/")
def listar_alunos(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return db.query(Aluno).all()

@app.post("/pagamentos/")
def registrar_pagamento(aluno_id: int, periodo: str, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    aluno = db.query(Aluno).filter(Aluno.id == aluno_id).first()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    pagamento = Pagamento(aluno_id=aluno_id, periodo=periodo)
    db.add(pagamento)
    db.commit()
    db.refresh(pagamento)
    return pagamento

@app.get("/alunos/inadimplentes/")
def listar_inadimplentes(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    inadimplentes = db.query(Aluno).filter(~Aluno.pagamentos.any()).all()
    return inadimplentes

@app.get("/alunos/{aluno_id}/status")
def status_aluno(aluno_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    aluno = db.query(Aluno).filter(Aluno.id == aluno_id).first()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    return {
        "id": aluno.id,
        "nome": aluno.nome,
        "contato": aluno.contato,
        "data_matricula": aluno.data_matricula,
        "pagamentos": [{
            "id": p.id,
            "data_pagamento": p.data_pagamento,
            "periodo": p.periodo
        } for p in aluno.pagamentos]
    }

@app.post("/alunos/")
def criar_aluno(aluno: AlunoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    novo_aluno = Aluno(
        nome=aluno.nome, 
        contato=aluno.contato, 
        telefone=aluno.telefone,
        forma_pagamento=aluno.forma_pagamento,
        data_matricula=aluno.data_matricula,
        fim_plano=aluno.fim_plano,
        valor_mensalidade=aluno.valor_mensalidade,
    )
    db.add(novo_aluno)
    db.commit()
    db.refresh(novo_aluno)
    return novo_aluno

# Rota para inicializar um usuário admin caso não exista
@app.on_event("startup")
async def startup_db_client():
    db = SessionLocal()
    admin = get_user(db, "admin")
    if not admin:
        admin_pwd = get_password_hash("1234")
        admin = Usuario(username="admin", hashed_password=admin_pwd)
        db.add(admin)
        db.commit()
    db.close()