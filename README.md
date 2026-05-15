# Class Pets - Gamified Classroom Management

Transform your classroom into an engaging learning adventure! Class Pets helps teachers motivate students through gamification, virtual pets, point systems, and group competitions.

[中文说明](#中文)

---

## Features

### Virtual Pets
- Students collect and level up their own virtual pets
- Pets grow as students earn points
- Visual feedback for achievements

### Point System
- Award points for homework, participation, and good behavior
- Customizable point items
- Full point history tracking

### Smart Group Management
- Create groups manually or randomly assign
- Group leaderboards
- Foster teamwork

### Fair Random Selection
- Weighted algorithm considers recent picks
- Everyone gets a fair chance
- Perfect for classroom activities

### Leaderboards
- Individual and group rankings
- Medal system for top 3
- Real-time updates

### Class Store
- Students spend earned badges
- Configurable reward items
- Stock management

---

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite 6
- Tailwind CSS 4
- React Router v7
- Recharts (for visualizations)

### Backend
- Express.js
- sql.js (SQLite in browser) / PostgreSQL (production)
- JWT Authentication
- bcryptjs password hashing

### Mobile
- Capacitor 6 (iOS support)

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd class-pets-ui-design

# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install
cd ..
```

### Development

```bash
# Start frontend (http://localhost:5173)
npm run dev

# Start backend (http://localhost:3001) - in another terminal
cd server
npm run dev
```

### Build for Production

```bash
# Build frontend
npm run build

# The build output is in the `dist/` folder
```

---

## Project Structure

```
class pets ui design/
├── src/                    # React frontend source
│   ├── app/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts (Auth, Language, Theme)
│   │   ├── services/      # API service modules
│   │   └── App.tsx        # Main app component
│   ├── styles/            # Global styles
│   └── main.tsx           # Entry point
├── server/                 # Express backend
│   ├── config/            # Database configuration
│   ├── middleware/        # Auth & validation middleware
│   ├── routes/            # API routes
│   ├── utils/             # Utilities (UUID)
│   └── index.js          # Server entry point
├── ios/                   # Capacitor iOS project
├── dist/                  # Production build output
└── capacitor.config.ts   # Capacitor configuration
```

---

## Environment Variables

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api  # Development
VITE_API_URL=https://your-api.com/api   # Production
```

### Backend (.env in server/)

```env
PORT=3001
CORS_ORIGINS=http://localhost:5173,capacitor://localhost
JWT_SECRET=your-secure-random-string
DATABASE_URL=  # Leave empty for sql.js, set for PostgreSQL
```

---

## Mobile App (iOS)

### Prerequisites
- macOS with Xcode
- Apple Developer Account ($99/year)

### Build Steps

```bash
# 1. Build web app
npm run build

# 2. Sync to iOS
npx cap sync ios

# 3. Open in Xcode
npx cap open ios

# 4. In Xcode:
#    - Select your team for signing
#    - Configure App Icon (1024x1024)
#    - Build and run on simulator/device
```

### App Store Submission

1. Create App Store Connect app
2. Prepare screenshots (see SCREENSHOT_GUIDE.md)
3. Write app description (see APP_STORE_CONTENT.md)
4. Upload build via Xcode
5. Submit for review

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/refresh | Refresh token |
| GET | /api/auth/me | Get current user |
| POST | /api/auth/change-password | Change password |

### Classes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/classes | Get all classes |
| POST | /api/classes | Create class |
| PUT | /api/classes/:id | Update class |
| DELETE | /api/classes/:id | Delete class |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/students?classId=X | Get students |
| POST | /api/students | Create student |
| POST | /api/students/batch | Batch create |
| PUT | /api/students/:id | Update student |
| DELETE | /api/students/:id | Delete student |
| POST | /api/students/:id/points | Award points |
| POST | /api/students/:id/pet | Assign pet |

### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/groups?classId=X | Get groups |
| POST | /api/groups | Create group |
| POST | /api/groups/random | Random assignment |
| PUT | /api/groups/:id | Update group |
| DELETE | /api/groups/:id | Delete group |

### Store
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/store/items | Get store items |
| POST | /api/store/items | Create item |
| PUT | /api/store/items/:id | Update item |
| DELETE | /api/store/items/:id | Delete item |
| POST | /api/store/exchange | Redeem item |

### Interactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/interactions/random-pick | Weighted random selection |

### Leaderboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/leaderboard?classId=X | Get rankings |

---

## Deployment

### Railway (Recommended)

1. Create project at [railway.app](https://railway.app)
2. Connect GitHub repository
3. Add PostgreSQL database (optional)
4. Set environment variables
5. Deploy

### Render

1. Create Web Service at [render.com](https://render.com)
2. Set root directory to `server`
3. Configure build/start commands
4. Set environment variables

---

## License

This project is for educational and personal use. See LICENSE file for details.

---

## Support

For issues and feature requests, please open a GitHub issue.

---

<a name="中文"></a>

# Class Pets - 游戏化班级管理工具

让课堂变成一场充满乐趣的学习冒险！Class Pets 帮助教师通过游戏化、虚拟宠物、积分系统和小组竞赛来激励学生。

### 功能特点

- **虚拟宠物** - 学生收集和养成自己的虚拟宠物
- **积分系统** - 自定义积分项目，完整积分历史
- **小组管理** - 手动或随机分组，小组排行榜
- **随机选人** - 加权随机算法，保证公平性
- **排行榜** - 个人和小组排名，奖牌系统
- **班级商店** - 学生兑换奖励，自定义商品

### 技术栈

- 前端：React 18 + TypeScript + Vite + Tailwind CSS
- 后端：Express.js + sql.js / PostgreSQL
- 移动端：Capacitor (iOS)

### 快速开始

```bash
# 安装依赖
npm install
cd server && npm install && cd ..

# 开发模式
npm run dev          # 前端 http://localhost:5173
cd server && npm run dev  # 后端 http://localhost:3001

# 生产构建
npm run build
```

### 部署到 Railway

1. 访问 [railway.app](https://railway.app) 创建项目
2. 连接 GitHub 仓库
3. 添加 PostgreSQL 数据库（可选）
4. 配置环境变量
5. 部署

---

*Made with ❤️ for teachers and students*
