'use server'

import { supabase, DatabaseMemo } from '@/lib/supabase'
import { Memo, MemoFormData } from '@/types/memo'

// DB row를 Memo 인터페이스로 변환
function toMemo(row: DatabaseMemo): Memo {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// 모든 메모 조회
export async function getMemos(): Promise<Memo[]> {
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch memos:', error)
    throw new Error('메모를 불러오는데 실패했습니다.')
  }

  return (data || []).map(toMemo)
}

// 단일 메모 조회
export async function getMemoById(id: string): Promise<Memo | null> {
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    console.error('Failed to fetch memo:', error)
    throw new Error('메모를 불러오는데 실패했습니다.')
  }

  return data ? toMemo(data) : null
}

// 메모 생성
export async function createMemo(formData: MemoFormData): Promise<Memo> {
  const { data, error } = await supabase
    .from('memos')
    .insert({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create memo:', error)
    throw new Error('메모 생성에 실패했습니다.')
  }

  return toMemo(data)
}

// 메모 수정
export async function updateMemo(id: string, formData: MemoFormData): Promise<Memo> {
  const { data, error } = await supabase
    .from('memos')
    .update({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update memo:', error)
    throw new Error('메모 수정에 실패했습니다.')
  }

  return toMemo(data)
}

// 메모 삭제
export async function deleteMemo(id: string): Promise<void> {
  const { error } = await supabase
    .from('memos')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete memo:', error)
    throw new Error('메모 삭제에 실패했습니다.')
  }
}

// 카테고리별 메모 조회
export async function getMemosByCategory(category: string): Promise<Memo[]> {
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch memos by category:', error)
    throw new Error('메모를 불러오는데 실패했습니다.')
  }

  return (data || []).map(toMemo)
}

// 메모 검색 (제목, 내용, 태그)
export async function searchMemos(query: string): Promise<Memo[]> {
  // Supabase에서 OR 조건으로 검색
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to search memos:', error)
    throw new Error('메모 검색에 실패했습니다.')
  }

  // 태그 검색은 클라이언트에서 추가 필터링
  const results = (data || []).map(toMemo)
  
  // 태그에서도 검색
  const queryLower = query.toLowerCase()
  return results.filter(
    memo =>
      memo.title.toLowerCase().includes(queryLower) ||
      memo.content.toLowerCase().includes(queryLower) ||
      memo.tags.some(tag => tag.toLowerCase().includes(queryLower))
  )
}

// 모든 메모 삭제
export async function clearAllMemos(): Promise<void> {
  const { error } = await supabase
    .from('memos')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 행 삭제

  if (error) {
    console.error('Failed to clear all memos:', error)
    throw new Error('메모 전체 삭제에 실패했습니다.')
  }
}
