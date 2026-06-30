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

# class OAuthLoginPayload(BaseModel):
#     provider: str
#     email: EmailStr
#     name: str

class AdminUserCreate(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    password: str
    role: str = "member"

class AdminUserUpdate(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None

class AdminLinkCreate(BaseModel):
    url: str
    name: Optional[str] = None
    alias: Optional[str] = None
    expired_at: Optional[datetime] = None
    owner_email: Optional[str] = None

class AdminLinkUpdate(BaseModel):
    short_code: Optional[str] = None
    name: Optional[str] = None
    original_url: Optional[str] = None
    status: Optional[str] = None
    expired_at: Optional[datetime] = None

class AdminWorkspaceCreate(BaseModel):
    name: str
    owner_email: str

class AdminWorkspaceUpdate(BaseModel):
    name: str