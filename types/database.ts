export interface Profile {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
  created_at: string
}

export interface Click {
  id: string
  user_id: string
  click_count: number
  created_at: string
}

export interface UserStatistics extends Profile {
  total_clicks: number
}
