# System Diagram

```mermaid
flowchart LR
    user([User])
    subgraph Browser
        ui[React UI]
        parser[TM7 Parser]
        renderer[Diagram Renderer]
    end
    file[(Local .tm7 file)]
    paste[Pasted XML]

    user -->|select file| file --> ui
    user -->|paste XML| paste --> ui
    ui --> parser --> renderer --> ui
```
