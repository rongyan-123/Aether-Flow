#!/usr/bin/env python3
"""Check unseen emails that are NOT from boss"""
import imaplib, email, json
from email.header import decode_header

EMAIL_ACCOUNT = "3828281031@qq.com"
EMAIL_PASSWORD = "jtnwqeopwayhcddh"
BOSS_EMAIL = "2637754948@qq.com"

mail = imaplib.IMAP4_SSL("imap.qq.com", 993)
mail.login(EMAIL_ACCOUNT, EMAIL_PASSWORD)
mail.select("INBOX")

status, messages = mail.search(None, "UNSEEN")
if status == "OK" and messages[0]:
    ids = messages[0].split()
    for mid in ids:
        status, data = mail.fetch(mid, "(RFC822)")
        if status == "OK":
            msg = email.message_from_bytes(data[0][1])
            subject_parts = decode_header(msg["Subject"])
            subject = ""
            for part, charset in subject_parts:
                if isinstance(part, bytes):
                    try:
                        subject += part.decode(charset or "utf-8", errors="replace")
                    except:
                        subject += part.decode("utf-8", errors="replace")
                else:
                    subject += part
            sender = msg["From"]
            is_boss = BOSS_EMAIL in sender
            print(f"ID: {mid.decode()} | From: {sender} | Subject: {subject} | IsBoss: {is_boss}")
else:
    print("No unseen emails")
mail.logout()
