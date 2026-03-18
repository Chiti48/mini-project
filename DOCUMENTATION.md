# CT Workspace - คู่มือการใช้งานที่ครบถ้วนที่สุด

## 📋 ภาพรวมโปรเจค

**CT Workspace** เป็นแพลตฟอร์มการทำงานร่วมกันแบบ real-time ที่พัฒนาด้วย Next.js 16, React 19, และ Convex Database ซึ่งมีฟีเจอร์ครบครันสำหรับการจัดการทีม การสื่อสาร และการจัดการงาน

### 🎯 ฟีเจอร์หลัก

- **🏢 Workspace Management** - จัดการพื้นที่ทำงานหลายๆ พื้นที่
- **💬 Real-time Messaging** - แชทแบบ real-time ใน channels และ direct messages
- **🔔 Smart Notifications** - ระบบแจ้งเตือนอัจฉริยะพร้อม unread count
- **📋 Task Management** - ระบบจัดการงานแบบ Kanban Board
- **👥 Member Management** - จัดการสมาชิกและสิทธิ์การใช้งาน
- **🔐 Secure Authentication** - ระบบยืนยันตัวตนที่ปลอดภัย
- **📱 Responsive Design** - รองรับทุกขนาดหน้าจอ

---

## 🏗️ สถาปัตยกรรมระบบ

### 📁 โครงสร้างโปรเจค

```
mini-project/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # Authentication pages
│   │   ├── join/              # Workspace joining
│   │   └── workspace/         # Workspace routes
│   ├── components/            # Reusable UI components
│   ├── features/              # Feature-based modules
│   │   ├── auth/              # Authentication features
│   │   ├── channels/          # Channel management
│   │   ├── conversations/    # Direct messages
│   │   ├── members/           # Member management
│   │   ├── messages/          # Message handling
│   │   ├── notifications/     # Notification system
│   │   ├── tasks/             # Task management
│   │   └── workspaces/        # Workspace features
│   ├── hooks/                 # Custom React hooks
│   └── lib/                   # Utility functions
├── convex/                    # Convex backend
│   ├── schema.ts              # Database schema
│   ├── auth.ts                # Authentication config
│   ├── conversation.ts        # Conversation logic
│   ├── readReceipts.ts        # Read receipts
│   └── ...                    # Other backend modules
└── public/                    # Static assets
```

### 🗄️ Database Schema

#### Core Tables

**Users & Authentication**
- `users` - ข้อมูลผู้ใช้ (จาก @convex-dev/auth)
- `accounts` - บัญชีการเข้าถึง
- `sessions` - เซสชันผู้ใช้

**Workspace Management**
- `workspaces` - พื้นที่ทำงาน
- `members` - สมาชิกใน workspace (admin/member)

**Communication**
- `channels` - ช่องสนทนาสาธารณะ
- `conversations` - บทสนทนาส่วนตัว
- `messages` - ข้อความทั้งหมด
- `reactions` - ปฏิกิริยาต่อข้อความ
- `readReceipts` - บันทึกการอ่านข้อความ

**Task Management**
- `taskBoards` - กระดานงาน
- `taskLists` - รายการงาน
- `taskCards` - การ์ดงาน
- `taskComments` - ความเห็นเกี่ยวกับงาน
- `taskActivityLogs` - บันทึกกิจกรรม

---

## 🔐 ระบบ Authentication

### การลงทะเบียนและเข้าสู่ระบบ

ระบบใช้ **@convex-dev/auth** สำหรับการจัดการการยืนยันตัวตน:

1. **Email & Password Authentication**
   - ลงทะเบียนด้วยอีเมลและรหัสผ่าน
   - ยืนยันอีเมลอัตโนมัติ
   - รีเซ็ตรหัสผ่านผ่านอีเมล

2. **OAuth Providers**
   - Google OAuth
   - GitHub OAuth
   - สามารถเพิ่ม provider อื่นๆ ได้

### การจัดการเซสชัน

- **Session Management** - เซสชันถูกเก็บใน Convex database
- **Automatic Refresh** - โทเค็นจะถูกรีเฟรชอัตโนมัติ
- **Secure Storage** - ข้อมูลเซสชันถูกเข้ารหัส

### Components ที่เกี่ยวข้อง

```typescript
// หน้าลงทะเบียน
src/app/auth/sign-up/[[...sign-in]]/page.tsx

// หน้าเข้าสู่ระบบ
src/app/auth/sign-in/[[...sign-in]]/page.tsx

// User Button Component
src/features/auth/components/user-button.tsx
```

---

## 🏢 Workspace Management

### การสร้างและจัดการ Workspace

**Features:**
- สร้าง workspace ใหม่พร้อมชื่อและ join code
- เชิญสมาชิกผ่าน join code
- จัดการสิทธิ์ (admin/member)
- สลับระหว่าง workspace ได้

### API Endpoints

```typescript
// สร้าง workspace
await convex.mutation(api.workspaces.create, {
  name: "My Workspace",
  joinCode: "ABC123"
});

// ดึงข้อมูล workspace
const { data: workspace } = useQuery(api.workspaces.getById, {
  workspaceId: "workspace_id"
});

// ดึงรายการ workspace ของผู้ใช้
const { data: workspaces } = useQuery(api.workspaces.getWorkspaces);
```

### Components

- **CreateWorkspaceModal** - โมดัลสร้าง workspace
- **WorkspaceHeader** - ส่วนหัวของ workspace
- **WorkspaceSection** - ส่วนแสดงรายการใน sidebar

---

## 💬 Messaging System

### Channel Messaging

**Features:**
- สร้าง channel ใน workspace
- ส่งข้อความแบบ text และรูปภาพ
- Thread replies (ตอบกลับข้อความ)
- Real-time updates
- Emoji reactions

### Direct Messages (Conversations)

**Features:**
- สนทนาแบบ 1-on-1
- สร้างบทสนทนาอัตโนมัติเมื่อคลิกที่สมาชิก
- ประวัติการสนทนา
- Unread count สำหรับแต่ละบทสนทนา

### Message Types

```typescript
interface Message {
  body: string;                    // เนื้อหาข้อความ
  image?: Id<"_storage">;          // รูปภาพ (optional)
  memberId: Id<"members">;         // ผู้ส่ง
  workspaceId: Id<"workspaces">;   // Workspace ที่เกี่ยวข้อง
  channelId?: Id<"channels">;      // Channel (สำหรับ channel messages)
  conversationId?: Id<"conversations">; // บทสนทนา (สำหรับ DM)
  parentMessageId?: Id<"messages">; // ข้อความแม่ (สำหรับ threads)
  updatedAt?: number;              // เวลาแก้ไขล่าสุด
}
```

### Components

- **MessageInput** - ช่องป้อนข้อความ
- **MessageList** - รายการข้อความ
- **MessageItem** - รายการข้อความแต่ละรายการ
- **ThreadChannel** - หน้าจอ thread

---

## 🔔 Notification System

### Unread Count System

ระบบแจ้งเตือนที่ฉลาดและมีประสิทธิภาพ:

#### Read Receipts

```typescript
interface ReadReceipt {
  workspaceId: Id<"workspaces">;
  memberId: Id<"members">;
  channelId?: Id<"channels">;
  conversationId?: Id<"conversations">;
  lastReadAt: number;  // Timestamp ล่าสุดที่อ่าน
}
```

#### Features

- **Channel Unread Count** - นับข้อความที่ยังไม่อ่านในแต่ละ channel
- **Conversation Unread Count** - นับข้อความที่ยังไม่อ่านใน DM
- **Total Unread Count** - นับข้อความที่ยังไม่อ่านทั้งหมดใน workspace
- **Auto Mark as Read** - ทำเครื่องหมายอ่านอัตโนมัติเมื่อคลิก

#### Components

- **UnreadBadge** - แสดงจำนวนข้อความที่ยังไม่อ่าน (สำหรับ channel)
- **ConversationUnreadBadge** - แสดงจำนวนข้อความที่ยังไม่อ่าน (สำหรับ DM)

#### API Functions

```typescript
// Mark channel as read
await convex.mutation(api.readReceipts.markChannelAsRead, {
  channelId: "channel_id"
});

// Get unread count
const unreadCount = useQuery(api.readReceipts.getUnreadCount, {
  channelId: "channel_id"
});
```

---

## 📋 Task Management System

### Kanban Board Features

**Task Boards:**
- สร้างกระดานงานหลายๆ กระดาน
- จัดการรายการงาน (lists)
- ลากและวางการ์ดงาน
- มอบหมายผู้รับผิดชอบ
- กำหนดวันครบกำหนด
- แนบไฟล์และความเห็น

### Task Data Structure

```typescript
interface TaskCard {
  listId: Id<"taskLists">;
  title: string;
  description?: string;
  assigneeId?: Id<"members">;
  dueDate?: number;
  labels?: string[];
  attachments?: Id<"_storage">[];
  order: number;
  createdBy: Id<"members">;
  workspaceId: Id<"workspaces">;
}
```

### Components

- **TaskBoard** - กระดานงานหลัก
- **TaskList** - รายการงาน
- **TaskCard** - การ์ดงาน
- **TaskModal** - โมดัลแก้ไขงาน

---

## 🎨 UI/UX Design

### Design System

**Theme Colors:**
- Primary: `#337f37` (สีเขียว)
- Background: `#129a77` ถึง `#044f3b` (gradient)
- Text: White/Slate variations
- Active states: White backgrounds

**Components:**
- Built with **shadcn/ui**
- **Tailwind CSS** สำหรับ styling
- **Lucide React** สำหรับ icons
- **Radix UI** สำหรับ primitives

### Responsive Design

- **Mobile:** แสดง sidebar แบบ overlay
- **Tablet:** แสดง sidebar แบบ collapsible
- **Desktop:** แสดง sidebar แบบเต็ม

---

## 🔧 Technical Stack

### Frontend

- **Next.js 16** - React Framework
- **React 19** - UI Library
- **TypeScript** - Type Safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component Library
- **Jotai** - State Management
- **React Hook Form** - Form Handling

### Backend

- **Convex** - Database & Backend
- **@convex-dev/auth** - Authentication
- **File Storage** - Built-in Convex storage

### Development Tools

- **ESLint** - Code Linting
- **Bun** - Package Manager
- **Git** - Version Control

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+
- Bun (recommended) or npm/yarn
- Convex account

### Installation Steps

1. **Clone Repository**
```bash
git clone <repository-url>
cd mini-project
```

2. **Install Dependencies**
```bash
bun install
```

3. **Environment Setup**
```bash
cp .env.example .env.local
```

4. **Configure Convex**
```bash
bun convex dev
```

5. **Run Development Server**
```bash
bun dev
```

### Environment Variables

```env
CONVEX_DEPLOYMENT=your_deployment_url
CONVEX_URL=your_convex_url
```

---

## 📱 User Guide

### การเริ่มต้นใช้งาน

1. **สร้างบัญชีผู้ใช้**
   - ลงทะเบียนด้วยอีเมลและรหัสผ่าน
   - หรือเข้าสู่ระบบด้วย Google/GitHub

2. **สร้าง Workspace**
   - คลิก "Create Workspace"
   - ตั้งชื่อ workspace
   - รับ join code สำหรับเชิญสมาชิก

3. **เชิญสมาชิก**
   - แชร์ join code ให้สมาชิกคนอื่น
   - สมาชิกเข้าร่วมผ่านหน้า `/join`

4. **สร้าง Channel**
   - คลิก "New channel" (admin เท่านั้น)
   - ตั้งชื่อ channel
   - เริ่มสนทนา

5. **ส่งข้อความ**
   - เลือก channel หรือสมาชิก
   - พิมพ์ข้อความในช่อง input
   - ส่งข้อความด้วย Enter หรือปุ่มส่ง

6. **จัดการงาน**
   - ไปที่ "Task Boards"
   - สร้าง board ใหม่
   - เพิ่ม lists และ cards
   - มอบหมายและติดตามงาน

---

## 🔍 API Reference

### Authentication APIs

```typescript
// ดึงข้อมูลผู้ใช้ปัจจุบัน
const { data: currentUser } = useQuery(api.users.current);

// อัปเดตข้อมูลผู้ใช้
await convex.mutation(api.users.update, {
  name: "New Name",
  image: "new_image_url"
});
```

### Workspace APIs

```typescript
// สร้าง workspace
const workspaceId = await convex.mutation(api.workspaces.create, {
  name: "Workspace Name",
  joinCode: "JOIN123"
});

// ดึงสมาชิกใน workspace
const { data: members } = useQuery(api.members.getMembers, {
  workspaceId: "workspace_id"
});
```

### Message APIs

```typescript
// ส่งข้อความ
await convex.mutation(api.messages.create, {
  body: "Hello World",
  workspaceId: "workspace_id",
  channelId: "channel_id"
});

// ดึงข้อความใน channel
const { data: messages } = useQuery(api.messages.getMessages, {
  channelId: "channel_id"
});
```

---

## 🛠️ Development Guide

### การเพิ่ม Feature ใหม่

1. **สร้าง Feature Folder**
```
src/features/new-feature/
├── api/
│   ├── hooks.ts
│   └── index.ts
├── components/
│   └── component.tsx
└── types.ts
```

2. **สร้าง Convex Functions**
```typescript
// convex/new-feature.ts
export const createFeature = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    // Implementation
  }
});
```

3. **สร้าง React Hooks**
```typescript
// src/features/new-feature/api/hooks.ts
export const useCreateFeature = () => {
  return useMutation(api.newFeature.create);
};
```

### Best Practices

- **Feature-based Architecture** - จัดระเบียบตามฟีเจอร์
- **Type Safety** - ใช้ TypeScript เต็มที่
- **Error Handling** - จัดการข้อผิดพลาดอย่างเหมาะสม
- **Performance** - ใช้ React.memo และ useMemo
- **Accessibility** - ใส่ ARIA labels และ semantic HTML

---

## 🔒 Security Considerations

### 📱 Mobile Responsiveness

### ✅ Mobile Features Implemented

**1. Responsive Sidebar**
- **Mobile (< 1024px):** Sidebar ซ่อนอยู่แบบ overlay พร้อมปุ่ม hamburger menu
- **Desktop (≥ 1024px):** Sidebar แสดงตลอดเวลาแบบ fixed panel
- **Smooth Transitions:** มี animation สำหรับการเปิด/ปิด sidebar
- **Auto-close:** Sidebar ปิดอัตโนมัติเมื่อนำทางไปหน้าอื่นบน mobile

**2. Responsive Navigation**
- **Left Sidebar:** ปรับขนาดจาก `w-16` (mobile) ถึง `w-17.5` (desktop)
- **Workspace Sidebar:** มี scroll เมื่อมีข้อมูลเยอะบน mobile
- **Touch-friendly:** ปุ่มและ interactive elements มีขนาดเหมาะสม

**3. Responsive Task Boards**
- **Mobile:** แสดงแบบ horizontal scroll พร้อม card width คงที่
- **Desktop:** แสดงแบบ flex-wrap พร้อม card width ปรับตามหน้าจอ
- **Drag & Drop:** ทำงานได้ทั้งบน mobile และ desktop

**4. Mobile-first Design**
- **Breakpoints:** ใช้ Tailwind breakpoints (sm, md, lg, xl)
- **Touch Gestures:** รองรับ swipe และ touch interactions
- **Viewport Meta:** ตั้งค่า viewport สำหรับ mobile browsers

### 🔧 Mobile Components

**useMobileSidebar Hook**
```typescript
const { isOpen, isMobile, toggle, close, open } = useMobileSidebar();
```

**MobileSidebarToggle Component**
```typescript
<MobileSidebarToggle isOpen={isOpen} onToggle={toggle} />
```

**Responsive Layout Structure**
```typescript
// Mobile: Overlay sidebar with backdrop
// Desktop: Resizable panels
<ResizablePanel
  defaultSize={isMobile ? 0 : 20}
  minSize={isMobile ? 0 : 11}
  className={cn(
    "bg-[#247320a2]",
    isMobile && "fixed inset-y-0 left-0 z-50 w-80"
  )}
>
```

### 📱 Mobile User Experience

**Navigation Flow:**
1. **Hamburger Menu** - แสดง/ซ่อน workspace sidebar
2. **Touch Gestures** - swipe เพื่อปิด sidebar
3. **Auto Navigation** - ปิด sidebar เมื่อคลิกไปหน้าอื่น
4. **Overlay Backdrop** - คลิกพื้นหลังเพื่อปิด sidebar

**Responsive Breakpoints:**
- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (md-lg)
- **Desktop:** ≥ 1024px (lg)

**Performance Optimizations:**
- **Lazy Loading:** Components โหลดตามต้องการ
- **Touch Optimized:** ใช้ touch events แทน mouse events บน mobile
- **Smooth Animations:** ใช้ CSS transforms แทน position changes

---

## 🔐 Authentication Systemcurity

- **Session Management** - เซสชันถูกเก็บใน Convex
- **CSRF Protection** - มีการป้องกัน CSRF
- **Rate Limiting** - จำกัดคำขอต่อผู้ใช้


- **Row Level Security** - ตรวจสอบสิทธิ์ในแต่ละ query
- **Input Validation** - ตรวจสอบข้อมูล input ทุกครั้ง
- **File Upload Security** - ตรวจสอบประเภทไฟล์

---

## 📈 Performance Optimization

### Frontend Optimization

- **Code Splitting** - แบ่งโหลดตาม route
- **Image Optimization** - ใช้ Next.js Image component
- **Caching** - ใช้ React Query สำหรับ caching
- **Bundle Optimization** - ใช้ dynamic imports

### Backend Optimization

- **Database Indexing** - สร้าง index ให้เหมาะสม
- **Query Optimization** - ใช้ filter ที่มีประสิทธิภาพ
- **Batch Operations** - รวม operation หลายๆ อัน

---

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Problems**
   - ตรวจสอบ environment variables
   - ตรวจสอบ Convex deployment

2. **Real-time Updates**
   - ตรวจสอบ WebSocket connection
   - ตรวจสอบ Convex subscriptions

3. **File Upload Issues**
   - ตรวจสอบ file size limits
   - ตรวจสอบ storage permissions

### Debug Tools

- **Convex Dashboard** - ดูข้อมูล database
- **React DevTools** - debug React components
- **Network Tab** - ดู API calls

---

## 🤝 Contributing

### Development Workflow

1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

### Code Standards

- Use TypeScript
- Follow ESLint rules
- Write tests
- Update documentation

---

## 📞 Support

### Contact

- **Email:** support@ctworkspace.com
- **Documentation:** https://docs.ctworkspace.com
- **GitHub Issues:** https://github.com/your-repo/issues

### Resources

- **Convex Documentation:** https://docs.convex.dev
- **Next.js Documentation:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🎉 Acknowledgments

- **Convex Team** - สำหรับ database platform ที่ยอดเยี่ยม
- **Vercel** - สำหรับ Next.js framework
- **shadcn/ui** - สำหรับ component library
- **Tailwind CSS** - สำหรับ CSS framework

---

*Last Updated: March 2026*
*Version: 1.0.0*
