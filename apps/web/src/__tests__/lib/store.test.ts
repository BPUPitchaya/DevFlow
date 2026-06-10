import { describe, it, expect, beforeEach } from '@jest/globals'
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/lib/store'

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({ user: null, token: null, darkMode: false, isDemo: false })
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAuthStore())
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.darkMode).toBe(false)
    expect(result.current.isDemo).toBe(false)
  })

  it('should set auth credentials', () => {
    const { result } = renderHook(() => useAuthStore())
    
    act(() => {
      result.current.setAuth(
        { id: '1', email: 'test@example.com', name: 'Test User', role: 'ENGINEER' },
        'test-token'
      )
    })

    expect(result.current.user).toEqual({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'ENGINEER'
    })
    expect(result.current.token).toBe('test-token')
    expect(result.current.isDemo).toBe(false)
  })

  it('should logout and clear credentials', () => {
    const { result } = renderHook(() => useAuthStore())
    
    act(() => {
      result.current.setAuth(
        { id: '1', email: 'test@example.com', name: 'Test User', role: 'ENGINEER' },
        'test-token'
      )
    })

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
  })

  it('should toggle dark mode', () => {
    const { result } = renderHook(() => useAuthStore())
    
    expect(result.current.darkMode).toBe(false)
    
    act(() => {
      result.current.toggleDarkMode()
    })

    expect(result.current.darkMode).toBe(true)
    
    act(() => {
      result.current.toggleDarkMode()
    })

    expect(result.current.darkMode).toBe(false)
  })

  it('should switch user and set isDemo to true', () => {
    const { result } = renderHook(() => useAuthStore())
    
    act(() => {
      result.current.switchUser('u1')
    })

    expect(result.current.user).not.toBeNull()
    expect(result.current.isDemo).toBe(true)
  })
})
