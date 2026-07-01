# Technical

## 1. 技术栈

- 游戏：Mugshot Booth
- 类型：social
- 简述：At the booking camera, upload a selfie; the precinct files your case — B&W mugshot, ID board, charges from the AlterU Vice Squad: loitering with intent to vibe, unsent texts. GUILTY stamped.
- 框架 / 语言 / 构建：React, TypeScript, Vite, Less
- 渲染方式：Canvas/WebGL
- 依赖摘录：@types/react@^18.2.0, @types/react-dom@^18.2.0, @vitejs/plugin-react@^4.2.1, less@^4.2.0, react@^18.2.0, react-dom@^18.2.0, typescript@^5.3.3, vite@^5.1.0
- 平台元信息：meta.title=Mugshot Booth；cover_url=/poster.png；category=social；uuid=0874cd00-5b78-438f-9643-1e51f6b14d0c

## 2. 目录结构

- `index.html`：Vite/浏览器入口，挂载根节点和基础 meta。
- `package.json`：定义 npm 脚本、依赖和工程名称。
- `vite.config.ts`：配置构建、插件和相对路径 base。
- `meta.json`：平台发布元信息，包含标题和封面。
- `src/App.tsx`：React 组件和交互界面。
- `src/main.tsx`：React 组件和交互界面。
- `src/index.less`：视觉样式、布局、动画和响应式规则。
- `src/shared.d.ts`：游戏源码模块。
- `src/vite-env.d.ts`：游戏源码模块。
- `src/game-id.ts`：游戏源码模块。
- `src/MugshotBooth/MugshotBooth.tsx`：React 组件和交互界面。
- `src/MugshotBooth/types.ts`：游戏源码模块。
- `src/MugshotBooth/index.ts`：游戏源码模块。
- `src/MugshotBooth/MugshotBooth.less`：视觉样式、布局、动画和响应式规则。
- `src/MugshotBooth/utils/audio.ts`：游戏源码模块。
- `src/MugshotBooth/utils/headline.ts`：游戏源码模块。
- `src/MugshotBooth/utils/prompts.ts`：游戏源码模块。
- `src/MugshotBooth/utils/booking.ts`：游戏源码模块。

关键源码模块：

- `src/App.tsx`
- `src/main.tsx`
- `src/index.less`
- `src/shared.d.ts`
- `src/vite-env.d.ts`
- `src/game-id.ts`
- `src/MugshotBooth/MugshotBooth.tsx`
- `src/MugshotBooth/types.ts`
- `src/MugshotBooth/index.ts`
- `src/MugshotBooth/MugshotBooth.less`
- `src/MugshotBooth/utils/audio.ts`
- `src/MugshotBooth/utils/headline.ts`
- `src/MugshotBooth/utils/prompts.ts`
- `src/MugshotBooth/utils/booking.ts`
- `src/MugshotBooth/utils/selfie.ts`
- `src/MugshotBooth/components/Gallery.tsx`
- `src/MugshotBooth/components/MetaStrip.tsx`
- `src/MugshotBooth/components/PaperFrame.tsx`
- `src/MugshotBooth/components/CaseFile.tsx`
- `src/MugshotBooth/components/ProcessingScreen.tsx`
- `src/MugshotBooth/components/Chip.tsx`
- `src/MugshotBooth/components/RedRingWash.tsx`
- `src/MugshotBooth/components/TicketStub.tsx`
- `src/MugshotBooth/components/Residue.tsx`

## 3. 核心模块

- 状态管理与节奏：通过 React 状态与定时器处理倒计时、阶段推进或生成节奏。
- 渲染方式：Canvas/WebGL，样式由 CSS/Less 和组件结构共同完成。
- 碰撞 / 更新：源码包含命中、距离、边界或重叠判断，结果会影响得分、生命或阶段。
- 音频：包含程序化音频或音频文件播放，按交互事件触发。
- 多语言：包含 i18n / locale 检测或 `t()` 文案函数。
- 存储：使用 localStorage、useGameSave 或 persist 保存分数、收藏、墙数据或本地状态。
- Aigram 运行时：接入 `@shared/runtime` 或平台桥接能力，用于用户、资料页、分享、通知或平台 API。
- AI / 生成接口：包含图像生成、视觉识别、ref_url 或 img2img 相关流程。
- 社交墙 / 归档：包含 wall、gallery、feed 或 archive 数据流与浏览界面。

## 4. 扩展点

- 改玩法参数：优先查找 `src/` 内大写常量、hooks、主组件顶部配置或关卡数组。
- 换素材：替换 `public/`、`src/img/` 或源码 import 的图片/音频文件，并保持相对路径。
- 调视觉：修改主样式文件中的颜色、间距、动画时长、网格尺寸和响应式规则。
- 改文案：修改 i18n 字典、组件内标题按钮文案，保持 zh/en 同步。
- 加平台能力：在已有 `@shared/runtime`、useGameSave、排行榜、墙或通知调用附近扩展，避免另起一套存储。
