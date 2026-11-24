import { useState } from 'react'
import type { Conversation } from '../types/chat.types'
import type { ChatUser } from '../types/chatApi.types'
import { NicknameDialog } from './NicknameDialog'
import { avatarFor } from '../utils/chatView'

type Props = {
  conversation: Conversation
  members: ChatUser[]
  onNickname: (userId: string, nickname: string) => Promise<void>
  onClose: () => void
}

export function InfoPanel({ conversation, members, onNickname, onClose }: Props) {
  const [nicknamesOpen, setNicknamesOpen] = useState(false)
  const friend = conversation.participants[0]
  const name = conversation.isGroup ? conversation.groupName! : friend.name
  const avatar = conversation.isGroup ? conversation.groupAvatar || avatarFor(name) : friend.avatar
  return (
    <aside aria-label="Thông tin cuộc trò chuyện" className="absolute inset-y-0 right-0 z-20 w-full overflow-y-auto border-l p-5 shadow-xl sm:w-[300px] xl:static xl:shrink-0 xl:shadow-none 2xl:w-[340px]"
      style={{ background: 'var(--color-info-panel-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Thông tin</h3>
        <button onClick={onClose} aria-label="Đóng thông tin" className="rounded-lg px-3 py-1 text-xl">×</button>
      </div>
      <img src={avatar} alt={name} className="mx-auto mt-8 size-20 rounded-full object-cover" />
      <p className="mt-3 break-words text-center font-semibold">{name}</p>
      <p className="mt-2 text-center text-xs" style={{ color: 'var(--color-text-secondary)' }}>{conversation.isGroup ? `${conversation.participants.length + 1} thành viên` : 'Cuộc trò chuyện 1–1'}</p>
      {conversation.isGroup ? <div className="mt-8 divide-y divide-(--color-border) border-y border-(--color-border) text-sm">
        <details open className="py-2">
          <summary className="cursor-pointer py-3 font-semibold">Tùy chỉnh đoạn chat</summary>
          <button type="button" onClick={() => setNicknamesOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left font-medium text-(--color-info-panel-value) hover:bg-(--color-info-panel-file-hover) focus-visible:bg-(--color-info-panel-file-hover)">
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-(--color-info-panel-file-bg) font-semibold text-(--color-text)">Aa</span>
            Chỉnh sửa biệt danh
          </button>
        </details>
        <details open className="py-2">
          <summary className="cursor-pointer py-3 font-semibold">Thành viên trong đoạn chat</summary>
          <ul className="space-y-1">{members.map(member => {
            const profileName = member.displayName || member.username
            return <li key={member.id} className="flex items-center gap-3 px-2 py-2">
              <img src={member.avatar || avatarFor(profileName)} alt="" className="size-9 shrink-0 rounded-full object-cover" />
              <div className="min-w-0"><p className="truncate font-medium">{member.nickname || profileName}</p>
                <p className="truncate text-xs text-(--color-text-secondary)">{member.nickname ? profileName : '@' + member.username}</p></div>
            </li>
          })}</ul>
        </details>
        {nicknamesOpen && <NicknameDialog members={members} onSave={onNickname} onClose={() => setNicknamesOpen(false)} />}
      </div> : <p className="mt-8 rounded-xl bg-(--color-bg) p-4 text-sm leading-relaxed text-(--color-text-secondary)">
        Tin nhắn văn bản được lưu trong lịch sử. Bạn có thể nhắn tin khi hai người đang là bạn bè.
      </p>}
    </aside>
  )
}
