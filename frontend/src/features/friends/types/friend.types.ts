export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export type FriendRequest = {
  id: string
  sender: string
  receiver: string
  status: FriendRequestStatus
  createdAt: string
  respondedAt: string | null
}

export type SendFriendRequestPayload = {
  recieverName?: string
  recieverPhone?: string
}

export type FriendSubTab = 'friends' | 'pending' | 'sent'

export type ContactsMenuTab = 'friendList' | 'friendRequests'

export type UserSearchResult = {
  id: string
  username: string
  avatar: string | null
  phone: string | null
}
