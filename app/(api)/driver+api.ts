import { neon } from "@neondatabase/serverless";

const defaultDrivers = [
  {
    id: 1,
    first_name: "James",
    last_name: "Wilson",
    profile_image_url:
      "https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/",
    car_image_url:
      "https://ucarecdn.com/a2dc52b2-9641-45da-80e9-08147151257f/-/preview/465x466/",
    car_seats: 4,
    rating: "4.80",
  },
  {
    id: 2,
    first_name: "David",
    last_name: "Brown",
    profile_image_url:
      "https://ucarecdn.com/6ea6d83d-ef1a-4838-8064-530a3eaec629/-/preview/1000x666/",
    car_image_url:
      "https://ucarecdn.com/a3872f80-c094-409c-82f8-c9ff38429327/-/preview/930x933/",
    car_seats: 5,
    rating: "4.60",
  },
  {
    id: 3,
    first_name: "Michael",
    last_name: "Johnson",
    profile_image_url:
      "https://ucarecdn.com/0330d85c-232e-4c30-bd04-e5e4d0e3d688/-/preview/826x822/",
    car_image_url:
      "https://ucarecdn.com/289764fb-55b6-4427-b1d1-f655987b4a14/-/preview/930x618/",
    car_seats: 4,
    rating: "4.70",
  },
  {
    id: 4,
    first_name: "Robert",
    last_name: "Miller",
    profile_image_url:
      "https://ucarecdn.com/5ea35190-34f6-425e-9707-9ef4704164a4/-/preview/1000x666/",
    car_image_url:
      "https://ucarecdn.com/530a701a-ae33-43b0-88eb-5e6670d04bb7/-/preview/1000x666/",
    car_seats: 4,
    rating: "4.90",
  },
];

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const response = await sql`SELECT * FROM drivers`;

    return Response.json({ data: response });
  } catch (error) {
    console.error(
      "Error fetching drivers from database, using fallback:",
      error,
    );
    return Response.json({ data: defaultDrivers });
  }
}
