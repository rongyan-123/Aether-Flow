import os
B="D:/xiuxian/xiuxian/xiuxian-v2"
def w(p,c):
  fp=os.path.join(B,*p.split("/"))
  os.makedirs(os.path.dirname(fp),exist_ok=True)
  open(fp,"w",encoding="utf-8").write(c)
  print("wrote "+p)
