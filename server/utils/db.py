from sqlalchemy import Column, create_engine,Integer,String,Text
from sqlalchemy.orm import sessionmaker,declarative_base


DATABASE_URL = "mysql+pymysql://root:password@localhost:3306/xiuxian"
#数据库将采用mysql+ORM(sqlalchemy), ORM是一种摒弃了手写sql语句,允许直接操作对象的神奇工具
#不管任何数据库,任何工具,第一步,永远都是连接数据库,这个engine,主要就是用来连接
engine = create_engine(DATABASE_URL,pool_size=10,max_overflow=20)

#但是engine本身还没有接入ORM,所以这个sessionmaker,就是用来接入ORM的,同时也进行一些配置
SessionLocal = sessionmaker(autocommit=False,autoflush=False,bind=engine)

#如果想要定义一个类,里面包含着玩家的各个信息,那么,我们就需要映射到数据库中.
#传统sql,就要写语句,什么CREATE TABLE .....等等, ORM就不需要,它可以直接创建,但是有一个前提
#那就是必须创建下面这个基类, 之后, 我们自己定义的类, 将会以它为映射
Base = declarative_base()

class Player(Base):
  __tablename__ = "players"
  id = Column(Integer,Primary_key=True,index=True)
  name = Column(String(50),unique=True)
  level = Column(String(20))
  mana = Column(Integer,default=100)

#建表
Base.metadata.create_all(bind = engine)
