export interface User {
  id: string
  email: string
  name: string
  credits: number
  subscription: 'free' | 'pro' | 'premium'
  role: 'user' | 'admin'
  createdAt: string
}

export interface Generation {
  id: string
  userId: string
  originalImage: string
  enhancedImage?: string
  style: string
  prompt: string
  sliders?: SliderValues
  createdAt: string
}

export interface SliderValues {
  realism: number
  stylization: number
  closeup: number
  complexity: number
  lighting: number
}

export interface ApiResponse<T> {
  status: 'success' | 'error'
  data?: T
  message?: string
  error?: string
}
