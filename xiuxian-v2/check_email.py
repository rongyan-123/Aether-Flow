#!/usr/bin/env python3
"""Check QQ email for new messages from boss (2637754948@qq.com)"""

import imaplib
import email
from email.header import decode_header
import json
import os

EMAIL_ACCOUNT = "3828281031@qq.com"
EMAIL_PASSWORD = "jtnwqeopwayhcddh"
BOSS_EMAIL = "2637754948@qq.com"
STATE_FILE = os.path.join(os.path.dirname(__file__), "email_check_state.json")

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

def main():
    mail = imaplib.IMAP4_SSL("imap.qq.com", 993)
    mail.login(EMAIL_ACCOUNT, EMAIL_PASSWORD)
    mail.select("INBOX")

    # Load previous state
    seen_ids = set()
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            data = json.load(f)
            seen_ids = set(data.get("seen_ids", []))

    # Search for unseen emails from boss
    status, messages = mail.search(None, "UNSEEN", "FROM", BOSS_EMAIL)

    new_emails = []
    all_unseen = []
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
                all_unseen.append(f"  [{mid_str}] From: {sender} | Subject: {subject}")

    # Also check total unseen count
    status2, messages2 = mail.search(None, "UNSEEN")
    total_unseen = len(messages2[0].split()) if status2 == "OK" and messages2[0] else 0

    # Save state
    with open(STATE_FILE, "w") as f:
        json.dump({"seen_ids": list(seen_ids)}, f)

    mail.logout()

    # Output result
    result = {"count": len(new_emails), "total_unseen": total_unseen, "emails": new_emails, "all_unseen": all_unseen}
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
