import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const busTimetable = [
  { time: "07:00", destination: "駅前", remarks: "" },
  { time: "07:30", destination: "市役所", remarks: "" },
  { time: "08:00", destination: "駅前", remarks: "急行" },
  { time: "08:30", destination: "大学", remarks: "" },
  { time: "09:00", destination: "駅前", remarks: "" },
  { time: "09:30", destination: "市役所", remarks: "" },
  { time: "10:00", destination: "大学", remarks: "" },
]

export default function TimetablePage() {
  return (
    <div className="max-w-xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>バス時刻表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>時刻</TableHead>
                <TableHead>行き先</TableHead>
                <TableHead>備考</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {busTimetable.map((bus, idx) => (
                <TableRow key={idx}>
                  <TableCell>{bus.time}</TableCell>
                  <TableCell>{bus.destination}</TableCell>
                  <TableCell>{bus.remarks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}