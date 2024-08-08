'use client'
import { useState, useEffect } from "react"
import {MapComponent} from "@/components/MapComponent/index";

const TOKEN_ENDPOINT = "https://www.strava.com/oauth/token"

const getAccessToken = async () => {
  const body = JSON.stringify({
    client_id: process.env.NEXT_PUBLIC_STRAVA_ID,
    client_secret: process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET,
    refresh_token: process.env.NEXT_PUBLIC_STRAVA_REFRESH_TOKEN,
    grant_type: "refresh_token",
  })

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    },
    body,
  })
  if (res.status !== 200) {
    console.log(res)
  }
  const data = await res.json()
  return data
}

export default function Home() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const getActivities = async () => {
      const token = await getAccessToken()

      let moreData = true
      let page = 1;
      const per_page = 200;

      while (moreData) {
        const res = await fetch(`https://www.strava.com/api/v3/athlete/activities?access_token=${token.access_token}&page=${page}&per_page=${per_page}`)
          if (res.status !== 200) {
          console.log(res)
        }
          const newActivities = await res.json()
          setActivities([ ...activities, ...newActivities ])
          if (newActivities.length < 200) moreData = false;
      }
      console.log(activities)
    }

    getActivities()
  }, [activities])

  return (
    <>
    <main className="h-screen w-screen">
      <div className="flex flex-column h-screen">
        <div>
        <h1>Your Story</h1>

        </div>
      <MapComponent />

      </div>
    </main>

    </>
  );
}
