#!/usr/bin/env python3
import imaplib, email, sys, os, json
from email.header import decode_header

EMAIL_ACCOUNT = "3828281031@qq.com"
EMAIL_PASSWORD = "jtnwqeopwayhcddh"
BOSS_EMAIL = "2637754948@qq.com"
STATE_FILE = os.path.join(os.path.dirname(__file__), "email_check_state.json")

sys.stdout = open(sys.stdout.fileno(), mode="w", encoding="utf-8", buffering=1)

def decode_str(s):
    if s is None:
        return ""
    decoded_parts = decode_header(s)
    result = []
    for part, charset in decoded_parts:
        if isinstance(part, bytes):
            try:
                result.append(part.decode(charset or "utf-8", errors="replace"))
            except:
                result.append(part.decode("utf-8", errors="replace"))
        else:
            result.append(part)
    return "".join(result)

def get_body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                payload = part.get_payload(decode=True)
                if payload:
                    return payload.decode("utf-8", errors="replace")
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            return payload.decode("utf-8", errors="replace")
    return ""

mail = imaplib.IMAP4_SSL("imap.qq.com", 993)
mail.login(EMAIL_ACCOUNT, EMAIL_PASSWORD)
mail.select("INBOX")

# Load previous state
seen_ids = set()
if os.path.exists(STATE_FILE):
    with open(STATE_FILE, "r") as f:
        data = json.load(f)
        seen_ids = set(data.get("seen_ids", []))

# Search ALL emails from boss (not just unseen)
status, messages = mail.search(None, "FROM", BOSS_EMAIL)
new_emails = []
if status == "OK" and messages[0]:
    ids = messages[0].split()
    for mid in ids:
        mid_str = mid.decode()
        if mid_str in seen_ids:
            continue
        status, data = mail.fetch(mid, "(RFC822)")
        if status == "OK":
            msg = email.message_from_bytes(data[0][1])
            subject = decode_str(msg["Subject"])
            body = get_body(msg)
            date = msg["Date"]
            sender = msg["From"]
            new_emails.append({
                "id": mid_str,
                "subject": subject,
                "from": sender,
                "date": date,
                "body": body.strip()
            })
            seen_ids.add(mid_str)

# Save state
with open(STATE_FILE, "w") as f:
    json.dump({"seen_ids": list(seen_ids)}, f)

mail.logout()

print(json.dumps({"count": len(new_emails), "emails": new_emails}, ensure_ascii=False, indent=2))
