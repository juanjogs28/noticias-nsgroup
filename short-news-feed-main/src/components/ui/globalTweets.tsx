import { useEffect, useState } from "react"

interface Tweet {
  content: {
    text: string
    image?: string
  }
  published_date: string
  url: string
  author?: {
    handle?: string
    name?: string
    profile_url?: string
  }
}

export default function GlobalTweetsSection() {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch("http://localhost:3001/api/global-tweets")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setTweets(res.data)
        else setError(true)
      })
      .catch(() => setError(true))
  }, [])
  console.log("Tweets cargados:", tweets);
  if (error) return <p className="text-red-500 text-center">❌ Error al cargar tweets</p>

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tweets.map((tweet, idx) => (
        <div
          key={idx}
          className="bg-white rounded-lg shadow-md p-4 transition hover:shadow-lg border border-slate-200"
        >
          <div className="text-sm text-slate-600 mb-2">
            <a
              href={tweet.author?.profile_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-800 hover:underline"
            >
              @{tweet.author?.handle || "usuario"}
            </a>{" "}
            • {new Date(tweet.published_date).toLocaleDateString()}
          </div>
          <p className="text-slate-800 mb-3">{tweet.content?.text}</p>
          {tweet.content?.image && (
            <img
              src={tweet.content.image}
              alt="Imagen del tweet"
              className="w-full h-48 object-cover rounded"
            />
          )}
          <a
            href={tweet.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 text-sm hover:underline"
          >
            Ver en X
          </a>
        </div>
      ))}
    </div>
  )
}
