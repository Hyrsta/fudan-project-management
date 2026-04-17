import uvicorn


if __name__ == "__main__":
    uvicorn.run("news_brief_mvp.main:app", host="127.0.0.1", port=8000, reload=True)

