# Shackalope

Shackalope is an [MCP](https://modelcontextprotocol.io) server that brings your ham radio shack to Claude. Ask Claude how the bands are looking and it pulls live propagation and solar data. Ask it to confirm a contact and it makes you a QSL card. Some tools also show interactive views right in the conversation: a band conditions panel with a live image of the sun, and QSL cards with your own background photos.

It's early days. Logging, rig control, and talking to the rest of your radio software are on the way.

## Quick start

### Requirements

- [Node.js](https://nodejs.org) 24 or later
- [Claude Desktop](https://claude.ai/download)

### Install and run

```sh
git clone https://github.com/guyroyse/shackalope.git
cd shackalope
npm install
npm run build
npm start
```

The server listens at `http://localhost:3000/mcp`. Set `PORT` to use a different port, for example `PORT=3001 npm start`. Leave it running while you use Claude.

### Connect Claude Desktop

Claude Desktop connects to local HTTP servers through [`mcp-remote`](https://www.npmjs.com/package/mcp-remote). Add this to your `claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "shackalope": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:3000/mcp"]
    }
  }
}
```

Then fully quit and restart Claude Desktop. Connectors added under Settings → Connectors won't work here, because they're reached from Anthropic's servers and can't see your `localhost`.

### Try it

- "Set my station to K8XYZ, grid EN80, in Columbus, OH."
- "Show me the band conditions."
- "Make me a QSL card for W1AW. We worked on 14.074 FT8 and I sent -10."

## Your data

Shackalope keeps everything it saves as plain files in a folder you own:

| OS      | Location                                       |
| ------- | ---------------------------------------------- |
| Linux   | `~/.local/share/shackalope/v1/`                |
| macOS   | `~/Library/Application Support/Shackalope/v1/` |
| Windows | `%LOCALAPPDATA%\Shackalope\v1\`                |

Your station details are in `station.json`, and QSL card backgrounds are in `qsl-images/`. The server prints the folder's location when it starts.

## Tools

### Band conditions

- **`get_band_conditions`**: current HF and VHF propagation and solar-terrestrial data (solar flux, sunspots, A and K indices, solar wind, noise) from N0NBH's HamQSL.
- **`show_band_conditions`**: shows the band conditions as a panel with HF ratings, solar indices, and a live image of the sun.

### Your station

- **`get_station`**: your station's callsign, name, QTH, and Maidenhead grid.
- **`set_station`**: updates your station details.

### QSL cards

- **`show_qsl_card`**: shows a QSL card confirming a contact, using one of your saved background images.
- **`list_qsl_images`**: lists your saved QSL card backgrounds.
- **`save_qsl_image`**: saves a QSL card background from a URL (PNG, JPEG, GIF, or WebP, up to 5 MB).
- **`delete_qsl_image`**: deletes a saved QSL card background.

## Resources

### Data

- **`band-conditions://current`**: current band conditions as JSON.
- **`station://current`**: your station details as JSON.
- **`solar-image://sdo/{id}`**: the latest image of the sun from NASA's Solar Dynamics Observatory, in five views: composite, corona, chromosphere, sunspots, and magnetogram.
- **`qsl-image://{name}`**: a saved QSL card background.

### Views

- **`ui://band-conditions/band-conditions.html`**: the band conditions panel.
- **`ui://qsl-card/qsl-card.html`**: the QSL card.

## Credits

Band conditions come from [N0NBH's HamQSL](https://www.hamqsl.com/solar.html). Solar images are courtesy of NASA/SDO and the AIA and HMI science teams.

## License

Copyright © 2026 Guy Royse

Shackalope is free software: you can redistribute it and/or modify it under the terms of the [GNU Affero General Public License](LICENSE) as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
