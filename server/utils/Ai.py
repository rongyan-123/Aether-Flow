# 1. 加载环境变量（读取本地 .env 文件）
import operator
from typing import Annotated, TypedDict
from dotenv import load_dotenv
import os

# 加载项目根目录的 .env 文件（和 .env 同目录运行时，默认路径即可）
load_dotenv()

# 导入 LangChain 的模型初始化函数
from langchain.chat_models import init_chat_model  # langchain接口
from langchain_core.messages import SystemMessage,HumanMessage,AIMessage
from volcenginesdkarkruntime import Ark   # 豆包官方工具
from langchain_deepseek import ChatDeepSeek
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode # 内置工具节点
from langchain_openai import ChatOpenAI
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from langchain_core.messages import ToolMessage, AIMessage
from rich import print
from db import SessionLocal
@tool
def get_player_data(player_id:str):
   """
   当需要查询玩家信息时,调用此工具
   """
   db = SessionLocal()
   return "模拟数据库返回结果:成功值:201"

#状态机, langGraph里面, 在各个节点之间, 就使用这个东西进行通信
class GameState(TypedDict):
   messages:Annotated[list,operator.add] #历史记录,类型是list,列表(数组)

#这个是节点:大脑
def call_agent(state:GameState):
   #连接大模型
   llm=ChatOpenAI(
      model="doubao-seed-2-0-pro-260215", #模型名
      api_key = os.getenv("ARK_API_KEY"), #读取环境变量
      base_url = "https://ark.cn-beijing.volces.com/api/v3", #url
      temperature=0.1,
   )

   #让大模型绑定工具
   brain_with_tools = llm.bind_tools([get_player_data])

   #将message历史记录,全部发送给ai读取
   response = brain_with_tools.invoke(state["messages"])

   #返回值, 是一个ai的回复,给它起个名字叫做messages, 作为历史记录
   #我们只需要老老实实返回就行,强大的langGraph的系统会自动读取这个messages,然后添加到GameState里面.
   return {"messages":[response]}

#这个是一个节点:判断下一步去哪个节点
def router(state:GameState):
   
   #在python里面,这个叫做列表(跟数组差不多),可以用[-1]直接访问最后一个值
   last_message = state["messages"][-1] 
   #如果ai返回的内容,有工具,那么下一步就使用工具,返回call_tool
   if last_message.tool_calls:
      return "call_tool"
   #否则,就返回个finish,代表结束
   return "finish"

# 节点定义结束
# --- 开始组装流程图 ---

#这是一个节点的组装器
workflow = StateGraph(GameState)

#添加节点(就是刚刚写的函数)
workflow.add_node("agent_node",call_agent)
#这个节点是执行工具, 刚才ai只是拿到了工具的列表,并生成了工具需要的属性
# 但是最终,我们还是要手动调用工具,去处理业务逻辑,比如这里的查找,就是拿到ai生成的id,手动查
workflow.add_node("tool_node",ToolNode([get_player_data]))

#设置起点
workflow.set_entry_point("agent_node")

#设置条件边, 意思从agent_node节点出来后, 需要问个路, 看看接下来是结束, 还是继续调用工具
workflow.add_conditional_edges(
   "agent_node", #从哪个节点出来
   router,  #用什么节点来判断方向?
   {
      "call_tool":"tool_node",
      "finish":END
   }
)

#设置普通边, 意思是：只要 tool_node 运行完了，百分之百跳回 agent_node 继续运行。不用问路
workflow.add_edge("tool_node","agent_node")

#生成app,打包
app = workflow.compile()

#测试
if __name__ == "__main__":
   
   #invoke就是调用
   #然后关于里面的参数,需要解释一下. 
   #因为创建的GameState就是dict类型,最终整个格式是 message:XXX 这种
   #然后,由于value的类型是list,所以里面的字符串,还要用[]包裹,最终为 message:[XXX] 的格式
   #最后,由于历史记录有格式要求,必须用消息格式包裹,此处是用户发言,则使用HumanMessage
   response = app.invoke({"messages":[HumanMessage(content="查询玩家qichen的数据")]})

   #这是一些美化打印,不用管,只是看着舒服一点
   for msg in response["messages"]:
    if hasattr(msg, "content") and msg.content:
        print(f"[{msg.__class__.__name__}] {msg.content[:200]}")
    if hasattr(msg, "tool_calls") and msg.tool_calls:
        for tc in msg.tool_calls:
            print(f"  → 调用工具: {tc['name']}({tc['args']})")
   print("最终回复结果为:",response)
   
   