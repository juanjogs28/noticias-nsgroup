import { useEffect, useState } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";

export default function GlobalTweetsSection() {
  const [tweets, setTweets] = useState([]);
  const [error, setError] = useState(false);

  // slider es un MutableRefObject<KeenSliderInstance | null>
  const [sliderRef, slider] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: {
      perView: 3,
      spacing: 15,
    },
  });

  useEffect(() => {
    fetch("http://localhost:3001/api/global-tweets")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setTweets(res.data);
        else setError(true);
      })
      .catch(() => setError(true));
  }, []);

  if (error)
    return <p className="text-red-500 text-center">❌ Error al cargar tweets</p>;

  if (tweets.length === 0)
    return <p className="text-slate-500 text-center">Cargando tweets...</p>;

  return (
    <div className="relative">
      <div ref={sliderRef} className="keen-slider">
        {tweets.map((tweet, idx) => (
          <div
            key={idx}
            className="keen-slider__slide bg-white rounded p-4 shadow-md border border-slate-200"
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
                className="w-full h-40 object-cover rounded mb-2"
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

      {/* Flechas de navegación */}
      {slider.current && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              slider.current?.prev();
            }}
            className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-md"
            aria-label="Anterior"
          >
            ‹
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              slider.current?.next();
            }}
            className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-md"
            aria-label="Siguiente"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
