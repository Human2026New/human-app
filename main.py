from fastapi import FastAPI
from pydantic import BaseModel
from storage import load_data, save_data, today_str

app = FastAPI(title="HUMAN Backend")


# ---------- MODELS ----------
class CheckinRequest(BaseModel):
    telegram_id: str


# ---------- ENDPOINTS ----------

@app.post("/presence/checkin")
def presence_checkin(req: CheckinRequest):
    data = load_data()
    users = data["users"]
    uid = req.telegram_id
    today = today_str()

    if uid not in users:
        users[uid] = {
            "streak": 0,
            "last_checkin": None,
            "rewards": []
        }

    user = users[uid]

    if user["last_checkin"] == today:
        return {
            "status": "already_checked",
            "streak": user["streak"]
        }

    # novo check-in
    user["streak"] += 1
    user["last_checkin"] = today

    reward = None

    if user["streak"] == 10:
        reward = {"type": "bronze", "source": "10 dias presença"}
    elif user["streak"] == 30:
        reward = {"type": "prata", "source": "30 dias presença"}
    elif user["streak"] == 90:
        reward = {"type": "ouro", "source": "90 dias presença"}
    elif user["streak"] == 365:
        reward = {"type": "diamante", "source": "365 dias presença"}

    if reward:
        user["rewards"].append(reward)

    save_data(data)

    return {
        "status": "checked",
        "streak": user["streak"],
        "reward": reward
    }


@app.get("/rewards")
def get_rewards(telegram_id: str):
    data = load_data()
    users = data["users"]

    if telegram_id not in users:
        return {"rewards": []}

    return {"rewards": users[telegram_id].get("rewards", [])}
