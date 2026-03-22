"use client"

import PlaceCard from "@/components/PlaceCard"
import { type Post } from "@/lib/api"

export default function FeedClient({ initialPosts }: { initialPosts: Post[] }) {
  if (initialPosts.length === 0) {
    return <div className="text-center py-20 text-zinc-400 text-sm">Мест пока нет</div>
  }
  return (
    <>
      {initialPosts.map(post => <PlaceCard key={post.id} place={post} />)}
    </>
  )
}
