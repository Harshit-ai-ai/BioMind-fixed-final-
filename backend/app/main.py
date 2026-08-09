from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import PROJECT_NAME
from app.config import VERSION

from app.database.database import Base
from app.database.database import engine

from app.api.routes import router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=PROJECT_NAME,
    version=VERSION,
)

# CORS Middleware for Hackathon Prototype (Frontend & Local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://biomind-hackverse2.netlify.app",
        "https://biomind-hackverse.vercel.app",
        "https://biomind-hackverse-fauk5h5wj-tanay-s-org.vercel.app",
        "https://bio-mind-fixed-final.vercel.app/",
        "https://bio-mind-fixed-final-git-main-harshityo1997-9177s-projects.vercel.app/",
        "https://biomind-hackverse.vercel.app/",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)