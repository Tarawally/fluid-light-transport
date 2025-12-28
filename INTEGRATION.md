# Digital Garden Integration

This repository features a seamless integration with the [Digital Garden](https://github.com/Tarawally/digital-garden). Documentation written here in the `docs/` directory is automatically synchronised to the garden whenever changes are pushed to the `main` branch.

## Architecture

The integration uses a **Repository Dispatch** model to decouple the build process.

1.  **Trigger (`fluid-light-transport`)**:
    *   A push to `docs/` triggers `.github/workflows/notify-garden.yml`.
    *   This workflow sends a `docs_updated` event to the `digital-garden` repository using a Personal Access Token.

2.  **Subscriber (`digital-garden`)**:
    *   The `digital-garden` repository listens for the `docs_updated` event via `.github/workflows/sync-docs.yml`.
    *   It checks out the latest `fluid-light-transport` code.
    *   It installs Quarto and builds the interactive notebook.
    *   It runs `scripts/sync-to-quartz.js` to generate search-optimised Markdown stubs and copy static assets.
    *   Finally, it commits the changes to the garden.

## Setup Requirements

To enable this behaviour, you must configure a Secret in the **Fluid Light Transport** repository.

1.  **Generate a PAT**: Create a GitHub Personal Access Token (Classic) with `repo` scope. This token must belong to a user with write access to the `digital-garden` repository.
2.  **Add Secret**: Go to `Settings` > `Secrets and variables` > `Actions` in the `fluid-light-transport` repo.
3.  **Create Secret**: Add a new repository secret named `GARDEN_DISPATCH_TOKEN` containing your token.

## Local Testing

You can test the conversion script locally:

```bash
node scripts/sync-to-quartz.js ../digital-garden/content/fluid-light-transport
```

Ensure you are in the root of the `fluid-light-transport` repository when running this command (adjusting the path to your local digital garden copy as necessary).