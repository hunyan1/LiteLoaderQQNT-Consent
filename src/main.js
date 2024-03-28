// 运行在 Electron 主进程 下的插件入口
// const uuidv4 = require('uuid/v4');
const { ipcMain } = require("electron");
// 创建窗口时触发
module.exports.onBrowserWindowCreated = window => {
    // window 为 Electron 的 BrowserWindow 实例
    window.webContents.on("did-stop-loading", () => {
        // 只在主界面或者单独聊天触发
        if (window.webContents.getURL().indexOf("#/main/message") !== -1||window.webContents.getURL().indexOf("#/chat") != -1) {
            console.log("自动同意好友插件加载")
            const original_send = window.webContents.send;
            const patched_send = function (channel, ...args) {
                const payload = args?.[1]?.[0]?.payload
                // console.log(args?.[1]?.[0]?.cmdName)
                switch (args?.[1]?.[0]?.cmdName) {
                    case "nodeIKernelBuddyListener/onBuddyReqChange":
                        for (const req of payload.data.buddyReqs) {
                            if (req.isUnread) {
                                console.log("好友申请", req);
                                try {
                                    approvalFriendRequest(req.friendUid,req.reqTime)
                                } catch (e) {
                                    console.log("出现错误", e);
                                }
                            }
                        }
                        break;
                }
                return original_send.call(window.webContents, channel, ...args);
            };
            window.webContents.send = patched_send;
        }
    })
}

function approvalFriendRequest(friendUid, reqTime) {
    const uuidv4 = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            }
        );
    }
    const uuid = uuidv4()
    const apiArgs = ["nodeIKernelBuddyService/approvalFriendRequest", {
        "approvalInfo": {
            "friendUid": friendUid,
            "reqTime": reqTime,
            "accept": true
        }
    }]
    ipcMain.emit(
        "IPC_UP_2",
        {
            sender: {
                send: (..._args) => {
                },
            },
        },
        {type: 'request', callbackId: uuid, eventName:"ns-ntApi-2"},
        apiArgs
    )
}