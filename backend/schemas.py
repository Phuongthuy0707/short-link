from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# --- BIỂU MẪU CHO TÀI KHOẢN (USER) ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class TokenData(BaseModel):
    token: str
    token_type: str = "bearer"

# --- BIỂU MẪU CHO RÚT GỌN LINK ---
class ShortenRequest(BaseModel):
    url: str
    name: Optional[str] = None
    alias: Optional[str] = None      
    domain_id: Optional[int] = None   
    domain: Optional[str] = None
    workspace_id: Optional[int] = None 
    params: Optional[str] = None
    password: Optional[str] = None   
    expired_at: Optional[datetime] = None

class LinkUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    expired_at: Optional[datetime] = None

# --- BIỂU MẪU CHO KHÔNG GIAN LÀM VIỆC (WORKSPACE) ---
class WorkspaceCreate(BaseModel):
    name: str

class WorkspaceInvite(BaseModel):
    email: str
    role_in_workspace: str

class WorkspaceMemberUpdate(BaseModel):
    role_in_workspace: str = "viewer"  # owner, editor, viewer