/**

@swagger
/api/clients:
get:
tags:
- Clients
summary: Get all clients
responses:
200:
description: Success
 */

export async function GET() {
  return Response.json([
    { id: 1, name: "Client A" }
  ]);
}