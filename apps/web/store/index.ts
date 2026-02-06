import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { UserConfig } from '../domain/userConfig'

export const dataAtom = atom<UserConfig[]>([])

// 最後に選択したスライドのインデックスをlocalStorageに保存
export const lastSlideAtom = atomWithStorage<number>('lastSlide', 0)

export const selectedDestinationsAtom = atomWithStorage<{
  [groupId: number]: number | null
}>('selectedDestinations', {})

// ユーザー設定をlocalStorageに保存
export const userConfigAtom = atomWithStorage<{
  username: string
  department: string
  notifications: boolean
  locateNotifications: boolean
}>('userConfig', {
  username: '',
  department: '',
  notifications: true,
  locateNotifications: true,
})
