import { atom } from 'jotai'
import { Saved } from '../domain/seve_data'
export const dataAtom = atom<Saved[]>([])
