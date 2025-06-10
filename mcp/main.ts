import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js' 
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import fetch from 'node-fetch';

const server = new McpServer({
    name: "mcp-server",
    version: "0.0.1",
    port: 5010
}); 

server.tool(
    "fetch-weather",
    "Herramienta para obtener el clima",
    {
        city: z.string().describe("City name"),
    }, 
    async ({ city }) => {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=10&language=es&format=json`);
        const data = await response.json();
        if (data.results.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: `City ${city} not found.`
                    }
                ]
            }
        }
        const { latitude, longitude } = data.results[0];
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&current=temperature_2m,precipitation,is_day,rain`);
        const weatherData = await weatherResponse.json();
        return {
            content: [
                {
                    type: "text",
                    text: `Weather in ${city}:\n` +
                        `Temperature: ${weatherData.current_weather.temperature}°C\n` +
                        `Precipitation: ${weatherData.current_weather.precipitation}mm\n` +
                        `Is day: ${weatherData.current_weather.is_day}\n` +
                        `Rain: ${weatherData.current_weather.rain}mm\n`
                    
                }
                
            ]
        };
    }  
)

const transport = new StdioServerTransport()
await server.connect(transport)
console.log("Server MCP started on port 5010")