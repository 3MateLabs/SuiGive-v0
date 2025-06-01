import { Clock } from "lucide-react"

interface CrowdfundCardProps {
  title: string
  description: string
  progress: number
  color: string
  daysAgo: number
}

export default function CrowdfundCard({ title, description, progress, color, daysAgo }: CrowdfundCardProps) {
  return (
    <div className="glassmorphism rounded-xl overflow-hidden h-full flex flex-col">
      <div className={`p-4 ${color} bg-opacity-30`}>
        <div className="w-12 h-12 rounded-lg glassmorphism flex items-center justify-center mb-4">
          <span className="text-lg">💰</span>
        </div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-gray-700 mb-8">{description}</p>
      </div>
      <div className="p-4 mt-auto">
        <div className="progress-bar mb-2">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-4">
          <span>{progress}% completed</span>
          <span>Goal: 100%</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-1" />
          <span>Posted {daysAgo} days ago</span>
        </div>
      </div>
    </div>
  )
}
