import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { UserConfig } from '../domain/userConfig'

export const dataAtom = atom<UserConfig[]>([])

// 最後に選択したスライドのインデックスをlocalStorageに保存
export const lastSlideAtom = atomWithStorage<number>('lastSlide', 0)
