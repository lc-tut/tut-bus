import { ScheduleForDate, StopInfo } from '../types/timetable'

// バス停情報
export const busStopsInfo: StopInfo[] = [
  { id: 'university', name: '大学' },
  { id: 'station', name: '八王子駅' },
  { id: 'minami-station', name: '八王子みなみ野駅' },
  { id: 'student-hall', name: '学生会館' },
]

// APIから取得することを想定
export const sampleSchedule: ScheduleForDate[] = [
  {
    date: '2025-05-19',
    departure: {
      stopId: 'station',
      stopName: '八王子駅',
    },
    segments: [
      {
        segmentType: 'fixed',
        destination: {
          stopId: 'university',
          stopName: '大学',
        },
        times: [
          { departure: '05:30', arrival: '05:35' },
          { departure: '05:45', arrival: '05:50' },
          { departure: '06:00', arrival: '06:05' },
          { departure: '06:10', arrival: '06:15' },
          { departure: '06:20', arrival: '06:25' },
          { departure: '06:30', arrival: '06:35' },
          { departure: '07:00', arrival: '07:20' },
          { departure: '09:00', arrival: '09:20' },
          { departure: '10:00', arrival: '10:20' },
          { departure: '18:00', arrival: '18:20' },
          { departure: '22:30', arrival: '22:50' },
        ],
      },
      {
        segmentType: 'frequency',
        destination: {
          stopId: 'student-hall',
          stopName: '学生会館',
        },
        startTime: '08:30',
        endTime: '17:30',
        intervalMins: 60,
      },
      {
        segmentType: 'shuttle',
        destination: {
          stopId: 'university',
          stopName: '大学',
        },
        startTime: '07:30',
        endTime: '08:30',
        intervalRange: { min: 3, max: 5 },
      },
      {
        segmentType: 'shuttle',
        destination: {
          stopId: 'university',
          stopName: '大学',
        },
        startTime: '17:30',
        endTime: '19:00',
        intervalRange: { min: 4, max: 7 },
      },
    ],
  },
  {
    date: '2025-05-19',
    departure: {
      stopId: 'minami-station',
      stopName: '八王子みなみ野駅',
    },
    segments: [
      {
        segmentType: 'fixed',
        destination: {
          stopId: 'university',
          stopName: '大学',
        },
        times: [
          { departure: '07:15', arrival: '07:35' },
          { departure: '08:15', arrival: '08:35' },
          { departure: '10:30', arrival: '10:50' },
          { departure: '22:45', arrival: '23:05' },
        ],
      },
      {
        segmentType: 'shuttle',
        destination: {
          stopId: 'university',
          stopName: '大学',
        },
        startTime: '08:00',
        endTime: '09:30',
        intervalRange: { min: 5, max: 8 },
      },
    ],
  },
  {
    date: '2025-05-19',
    departure: {
      stopId: 'university',
      stopName: '大学',
    },
    segments: [
      {
        segmentType: 'fixed',
        destination: {
          stopId: 'station',
          stopName: '八王子駅',
        },
        times: [
          { departure: '08:30', arrival: '08:50' },
          { departure: '09:30', arrival: '09:50' },
          { departure: '16:30', arrival: '16:50' },
          { departure: '17:30', arrival: '17:50' },
        ],
      },
      {
        segmentType: 'fixed',
        destination: {
          stopId: 'minami-station',
          stopName: '八王子みなみ野駅',
        },
        times: [
          { departure: '11:00', arrival: '11:20' },
          { departure: '17:00', arrival: '17:20' },
        ],
      },
      {
        segmentType: 'shuttle',
        destination: {
          stopId: 'station',
          stopName: '八王子駅',
        },
        startTime: '08:00',
        endTime: '09:00',
        intervalRange: { min: 4, max: 6 },
      },
      {
        segmentType: 'shuttle',
        destination: {
          stopId: 'station',
          stopName: '八王子駅',
        },
        startTime: '18:00',
        endTime: '19:30',
        intervalRange: { min: 5, max: 7 },
      },
    ],
  },
]
