import type { User, Conversation } from '@/features/chat/types/chat.types'

// ─── Helpers ─────────────────────────────────────────────────
function avatar(name: string, bg = '2858cf') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true&size=128`
}

// ─── Users ───────────────────────────────────────────────────
export const currentUser: User = {
  id: 'me',
  name: 'Nhật Tiến',
  avatar: avatar('Nhật Tiến', '1e47b3'),
  online: true,
  phone: '0901 234 567',
}

export const users: User[] = [
  { id: 'u1', name: 'Minh Anh', avatar: avatar('Minh Anh', '6366f1'), online: true, phone: '0912 345 678' },
  { id: 'u2', name: 'Hoàng Nam', avatar: avatar('Hoàng Nam', '0891b2'), online: false, phone: '0923 456 789' },
  { id: 'u3', name: 'Thùy Linh', avatar: avatar('Thùy Linh', 'db2777'), online: true, phone: '0934 567 890' },
  { id: 'u4', name: 'Đức Huy', avatar: avatar('Đức Huy', '059669'), online: false, phone: '0945 678 901' },
  { id: 'u5', name: 'Phương Nhi', avatar: avatar('Phương Nhi', 'c2410c'), online: true, phone: '0956 789 012' },
  { id: 'u6', name: 'Quang Khải', avatar: avatar('Quang Khải', '4338ca'), online: true },
]

// ─── Conversations ───────────────────────────────────────────
export const conversations: Conversation[] = [
  {
    id: 'c1',
    participants: [users[0]],
    isGroup: false,
    lastMessage: 'Oke, chiều nay gặp nhé! 😊',
    lastMessageTime: '10:32',
    unread: 2,
    messages: [
      { id: 'm1', senderId: 'u1', type: 'text', content: 'Hey, hôm nay rảnh không?', timestamp: '10:15', date: '2026-09-19' },
      { id: 'm2', senderId: 'me', type: 'text', content: 'Rảnh nè, có gì không?', timestamp: '10:18', date: '2026-09-19' },
      { id: 'm3', senderId: 'u1', type: 'text', content: 'Đi café không? Quán mới mở ở quận 1 hay lắm', timestamp: '10:20', date: '2026-09-19' },
      { id: 'm4', senderId: 'me', type: 'image', content: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop', timestamp: '10:22', date: '2026-09-19' },
      { id: 'm5', senderId: 'me', type: 'text', content: 'Quán này nè, nhìn ổn không?', timestamp: '10:22', date: '2026-09-19' },
      { id: 'm6', senderId: 'u1', type: 'text', content: 'Wow đẹp quá! 🤩', timestamp: '10:25', date: '2026-09-19' },
      { id: 'm7', senderId: 'u1', type: 'voice', content: '', voiceDuration: 12, timestamp: '10:28', date: '2026-09-19' },
      { id: 'm8', senderId: 'me', type: 'file', content: 'menu-quan-cafe.pdf', fileSize: '2.4 MB', timestamp: '10:30', date: '2026-09-19' },
      { id: 'm9', senderId: 'u1', type: 'text', content: 'Oke, chiều nay gặp nhé! 😊', timestamp: '10:32', date: '2026-09-19' },
    ],
  },
  {
    id: 'c2',
    participants: [users[1]],
    isGroup: false,
    lastMessage: 'Gửi tài liệu cho mình nha',
    lastMessageTime: '09:45',
    unread: 0,
    messages: [
      { id: 'm10', senderId: 'u2', type: 'text', content: 'Bài tập tuần này làm chưa?', timestamp: '09:30', date: '2026-09-19' },
      { id: 'm11', senderId: 'me', type: 'text', content: 'Làm gần xong rồi, còn phần cuối', timestamp: '09:35', date: '2026-09-19' },
      { id: 'm12', senderId: 'u2', type: 'text', content: 'Gửi tài liệu cho mình nha', timestamp: '09:45', date: '2026-09-19' },
    ],
  },
  {
    id: 'c3',
    participants: [users[0], users[1], users[2], users[5]],
    isGroup: true,
    groupName: 'Team Dự Án',
    lastMessage: 'Thùy Linh: Meeting lúc 3h chiều nhé',
    lastMessageTime: '09:10',
    unread: 5,
    messages: [
      { id: 'm13', senderId: 'u3', type: 'text', content: 'Mọi người ơi, update tiến độ nào', timestamp: '08:50', date: '2026-09-19' },
      { id: 'm14', senderId: 'u1', type: 'text', content: 'Phần frontend mình xong 80% rồi', timestamp: '08:55', date: '2026-09-19' },
      { id: 'm15', senderId: 'me', type: 'text', content: 'Backend cũng gần xong, đang test API', timestamp: '09:00', date: '2026-09-19' },
      { id: 'm16', senderId: 'u6', type: 'file', content: 'bao-cao-tien-do.docx', fileSize: '1.8 MB', timestamp: '09:05', date: '2026-09-19' },
      { id: 'm17', senderId: 'u3', type: 'text', content: 'Meeting lúc 3h chiều nhé', timestamp: '09:10', date: '2026-09-19' },
    ],
  },
  {
    id: 'c4',
    participants: [users[2]],
    isGroup: false,
    lastMessage: 'Cảm ơn nhiều nha! 💕',
    lastMessageTime: 'Hôm qua',
    unread: 0,
    messages: [
      { id: 'm18', senderId: 'u3', type: 'text', content: 'Cho mình hỏi bài số 5 làm sao vậy?', timestamp: '20:15', date: '2026-09-18' },
      { id: 'm19', senderId: 'me', type: 'text', content: 'Để mình giải thích cho nè', timestamp: '20:20', date: '2026-09-18' },
      { id: 'm20', senderId: 'me', type: 'image', content: 'https://images.unsplash.com/photo-1596496050827-8299e0220de1?w=400&h=300&fit=crop', timestamp: '20:22', date: '2026-09-18' },
      { id: 'm21', senderId: 'u3', type: 'text', content: 'Cảm ơn nhiều nha! 💕', timestamp: '20:30', date: '2026-09-18' },
    ],
  },
  {
    id: 'c5',
    participants: [users[3]],
    isGroup: false,
    lastMessage: 'Mai đá bóng không?',
    lastMessageTime: 'Hôm qua',
    unread: 1,
    messages: [
      { id: 'm22', senderId: 'u4', type: 'text', content: 'Mai đá bóng không?', timestamp: '18:00', date: '2026-09-18' },
    ],
  },
  {
    id: 'c6',
    participants: [users[4]],
    isGroup: false,
    lastMessage: 'Hẹn gặp lại! 🌸',
    lastMessageTime: 'T2',
    unread: 0,
    messages: [
      { id: 'm23', senderId: 'me', type: 'text', content: 'Chúc mừng sinh nhật nha! 🎂', timestamp: '10:00', date: '2026-09-15' },
      { id: 'm24', senderId: 'u5', type: 'text', content: 'Cảm ơn bạn! 🥰', timestamp: '10:30', date: '2026-09-15' },
      { id: 'm25', senderId: 'u5', type: 'voice', content: '', voiceDuration: 8, timestamp: '10:32', date: '2026-09-15' },
      { id: 'm26', senderId: 'u5', type: 'text', content: 'Hẹn gặp lại! 🌸', timestamp: '10:35', date: '2026-09-15' },
    ],
  },
  {
    id: 'c7',
    participants: [users[5]],
    isGroup: false,
    lastMessage: 'Link repo nè: github.com/...',
    lastMessageTime: 'T2',
    unread: 0,
    messages: [
      { id: 'm27', senderId: 'u6', type: 'text', content: 'Mình push code lên rồi nha', timestamp: '14:00', date: '2026-09-15' },
      { id: 'm28', senderId: 'u6', type: 'text', content: 'Link repo nè: github.com/...', timestamp: '14:01', date: '2026-09-15' },
    ],
  },
]

// ─── Shared media (for InfoPanel) ────────────────────────────
export const sharedMedia = [
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1596496050827-8299e0220de1?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=120&h=120&fit=crop',
]
