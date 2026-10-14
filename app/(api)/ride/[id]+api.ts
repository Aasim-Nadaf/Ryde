import { neon } from "@neondatabase/serverless";

export async function GET(request: Request, { id }: { id: string }) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);

    let response: any[] = [];

    // If id is provided and not "all" / "undefined", query for that specific user
    if (id && id !== "undefined" && id !== "all") {
      response = await sql`
        SELECT
            rides.ride_id,
            rides.origin_address,
            rides.destination_address,
            rides.origin_latitude,
            rides.origin_longitude,
            rides.destination_latitude,
            rides.destination_longitude,
            rides.ride_time,
            rides.fare_price,
            rides.payment_status,
            rides.created_at,
            json_build_object(
                'driver_id', drivers.id,
                'first_name', drivers.first_name,
                'last_name', drivers.last_name,
                'profile_image_url', drivers.profile_image_url,
                'car_image_url', drivers.car_image_url,
                'car_seats', drivers.car_seats,
                'rating', drivers.rating
            ) AS driver 
        FROM 
            rides
        INNER JOIN
            drivers ON rides.driver_id = drivers.id
        WHERE 
            rides.user_id = ${id}
        ORDER BY 
            rides.created_at DESC;
      `;
    }

    // If no rides were found for this user (or id is "all" / "undefined"),
    // return the latest platform rides so screens always display rich data during demos!
    if (!response || response.length === 0) {
      response = await sql`
        SELECT
            rides.ride_id,
            rides.origin_address,
            rides.destination_address,
            rides.origin_latitude,
            rides.origin_longitude,
            rides.destination_latitude,
            rides.destination_longitude,
            rides.ride_time,
            rides.fare_price,
            rides.payment_status,
            rides.created_at,
            json_build_object(
                'driver_id', drivers.id,
                'first_name', drivers.first_name,
                'last_name', drivers.last_name,
                'profile_image_url', drivers.profile_image_url,
                'car_image_url', drivers.car_image_url,
                'car_seats', drivers.car_seats,
                'rating', drivers.rating
            ) AS driver 
        FROM 
            rides
        INNER JOIN
            drivers ON rides.driver_id = drivers.id
        ORDER BY 
            rides.created_at DESC
        LIMIT 10;
      `;
    }

    return Response.json({ data: response });
  } catch (error) {
    console.error("Error fetching recent rides:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
