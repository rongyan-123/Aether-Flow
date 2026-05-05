# 1. 加载环境变量（读取本地 .env 文件）
from dotenv import load_dotenv
import os

# 加载项目根目录的 .env 文件（和 .env 同目录运行时，默认路径即可）
load_dotenv('.env.development')

# 导入 LangChain 的模型初始化函数
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain.chat_models import init_chat_model  # langchain接口
from langchain_core.messages import SystemMessage,HumanMessage,AIMessage
from langchain.tools import tool
from volcenginesdkarkruntime import Ark   # 豆包官方工具
from langchain_deepseek import ChatDeepSeek
from langchain_community.callbacks.manager import get_openai_callback
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.prompts import MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from langchain_redis import RedisChatMessageHistory
# 1. 初始化模型
model = ChatOpenAI(
    model="doubao-seed-2-0-pro-260215",
    temperature=0.7, # 增加随机性，防止复读
    max_tokens=1000, # 强制限制单次输出长度
    openai_api_key=os.getenv("ARK_API_KEY"), # 确保你 .env 里叫这个名
    openai_api_base="https://ark.cn-beijing.volces.com/api/v3" # 豆包的 API 入口
    ) # 或对应的国内模型

# 2. 定义模板
prompt_story = ChatPromptTemplate.from_messages([
    ("system", "请为玩家生成一段 50 字的背景故事,原样保留玩家名字和职业。"),
    ("human", "玩家名字：{player_name}，职业：{job}。请开始你的表演。")
])
prompt_plot = ChatPromptTemplate.from_messages([
    ("system","你是一个起点网文作家，请用起承转合的节奏,搭配剧情{background}来书写一段剧情,偏网文风格。"),
])
prompt = ChatPromptTemplate.from_messages([
    ("system","你是一个资深主持人，请用根据剧情{plot}和历史记录,来主持游戏。"),
    MessagesPlaceholder(variable_name="history")
])



demo_History = ChatMessageHistory()
def getHistory(session_id:str) :
    # 只返回最近的 6 条消息（大约 3 轮对话），防止 Token 爆炸
    demo_History.messages = demo_History.messages[-6:]
    return RedisChatMessageHistory(
        session_id=session_id, 
        redis_url="redis://localhost:6379"
    )


# 3. 组合链
chain_story = RunnablePassthrough.assign(
    background = prompt_story | model | StrOutputParser()
)
chain_plot = RunnablePassthrough.assign(
    plot = prompt_plot | model | StrOutputParser()
)
chain_response = chain_story | chain_plot | prompt | model | StrOutputParser()

chain_with_history = RunnableWithMessageHistory(
    chain_response,
    getHistory,
    input_messages_key="content",
    history_messages_key="history"
)

if __name__ == "__main__":
    with get_openai_callback() as cb:
        user_input = {
            "player_name": "qichen", 
            "job": "魔战士",
            "content": "你好" # 增加一个实际的对话输入
        }

        result = chain_with_history.invoke(
            user_input,
            config = {"configurable":{"session_id":"user1"}}
        )
        print("Ai回答:",result)
        print(f"本次消耗: {cb.total_tokens} tokens")