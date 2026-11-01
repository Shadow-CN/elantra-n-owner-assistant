# 圈速视频链接：当前能力与后续方向

更新：2026-11-01。

## 用户确认的方向

保留“社交媒体视频以后直接在本小程序内播放”的设想。当前优先跳转查看；无法跳转时提供复制，用户不必重复上传视频。原上传视频仍为选填。

## 已实现

- 表单 `videoLink` 支持一个 HTTP(S) 网页链接或 `#小程序://…` 微信小程序链接，可从包含一个链接的分享文案中提取。
- 链接随成绩保存、公开展示、编辑或清除。仅链接发布不上传文件，不抓取第三方网页，不解析视频流。
- 小程序链接通过 `wx.navigateToMiniProgram({shortLink})` 尝试打开；普通社交平台网页链接仅提供复制，不伪造目标平台的 appId/path。
- 跳转调用失败或接口不存在，显示“复制链接”回退；用户取消跳转不再自动弹复制。复制按钮一直可用。
- 外部小程序是否存在、权限、能否直接进入目标视频和能否播放，必须用实际链接在真机验证；调用返回成功不等于目标视频成功播放。

## 当前不能据此声称支持的能力

- 任意抖音/B站/小红书网页分享链接直接唤起其 App 或指定视频小程序页。
- 将普通分享页 URL 直接作为 video 组件的视频地址。
- 视频号普通分享链接自动转换成官方打开接口需要的 feedId 和 finderUserName。官方 openChannelsActivity 需要这两个标识，当前未接入标识录入或解析。
- 未验证本账号是否可用 web-view，也未配置/验证外部平台业务域名。不能认为增加普通用户授权即可解决。

## 后续实现条件

1. 用户提供实际常用分享链接，逐个平台评估官方深链/小程序路径/视频号接口。
2. 若取得稳定且允许本应用使用的视频直链，独立增加播放源适配；保留原始分享链接作为长期来源和失败回退。
3. 若平台只提供网页/嵌入播放器，评估账号资质、业务域名配置、登录态和平台开放能力，再决定是否实现内嵌播放。
4. 这些均未开发，不要在UI宣称已支持；不采集分享链接对应账户的登录凭据。

## 官方接口依据

- 微信官方 API 类型与参数：https://github.com/wechat-miniprogram/api-typings/blob/master/types/wx/lib.wx.api.d.ts （NavigateToMiniProgramOption.shortLink、OpenChannelsActivityOption）。
- 跳转其他小程序：https://developers.weixin.qq.com/miniprogram/dev/api/navigate/wx.navigateToMiniProgram.html
- 视频号动态：https://developers.weixin.qq.com/miniprogram/dev/api/open-api/channels/wx.openChannelsActivity.html
- 网页容器：https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html

自动化测试覆盖分享文案解析、格式拒绝、链接单独发布、编辑清空、剪贴板复制、小程序跳转成功/失败/取消的回调分支。尚未用用户实际平台视频链接验证真机跳转或播放。

## 已核对的用户实际示例

用户提供抖音分享文案，包含 `https://v.douyin.com/tJeyV1wK-u8/`。

- 本地前端校验对完整原文案提取结果精确一致，已补同类真实链接回归用例。
- 2026-11-01 只读HTTP验证：v.douyin.com短链302 → iesdouyin.com/share/video/7703093037987873866/ 302 → www.douyin.com/video/7703093037987873866 200，最终Content-Type为text/html。
- 这只证明公开网页跳转可达，未提取视频流、未下载视频，不证明微信内可直接打开。
- 当前此示例按普通网页链接处理：可保存、编辑、展示、复制；不显示微信小程序跳转按钮。未用用户真实手机验证复制后在抖音内打开。

### B站示例 BV12g8t6NEWo

用户提供带中文标题和 `vd_source` 参数的 `https://www.bilibili.com/video/BV12g8t6NEWo` 链接。当前解析代码对用户完整原文测试通过，保留完整查询参数。

只读HTTP结果为301（补末尾斜杠）→200，最终Content-Type为text/html。检查该公开HTML未发现微信小程序AppID、页面路径或小程序跳转标记；这不足以判定B站没有微信小程序，只能说明此网页未提供可供当前实现使用的跳转参数。

当前按普通HTTP(S)链接展示/复制，不声称已验证B站小程序视频页跳转。如果用户能提供目标视频的 `#小程序://…` 链接，可直接使用已实现的官方跳转接口做真机验证。未解析视频流、未下载视频，也未将此链接提交为榜单成绩。
