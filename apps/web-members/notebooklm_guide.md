# Zero to Course with NotebookLM

## Why NotebookLM?
NotebookLM is Google's AI-powered research assistant. For course creators, its "killer feature" is the **Audio Overview**: it can take your written SOPs and generate a realistic, engaging "Deep Dive" podcast episode with two AI hosts discussing the material.

## Step-by-Step Walkthrough

### Phase 1: Create the Source Audio
1.  **Go to NotebookLM**: Visit [notebooklm.google.com](https://notebooklm.google.com/).
2.  **New Notebook**: Click the big "+" box ("New Notebook"). Title it "Field Inspector Training".
3.  **Add Source**: 
    *   Click "Add source" -> "Text file" (or copy-paste).
    *   Upload the **`field_inspector_handbook.md`** file I just created for you (located in your app directory).
4.  **Generate Audio**:
    *   Look for the **"Audio Overview"** section (usually on the right or top of the "Guide" panel).
    *   Click **"Generate"**.
    *   *Wait 3-5 minutes.* It will produce a 10-15 minute "podcast" conversation covering the handbook.
5.  **Download**:
    *   Listen to verify quality (it's usually shockingly good).
    *   Click the three dots `...` next to the player -> **Download**.

### Phase 2: Convert Audio to Video
Since our player expects video (and video is better for engagement), turn your audio into a simple video.

**Option A: The "Static Image" Method (Fastest)**
1.  Open any video editor (Canva, CapCut, Premiere).
2.  Add a background image (e.g., your "Nested Objects" logo or a photo of a house).
3.  Drag in the Audio file you downloaded.
4.  Export as generated MP4.

**Option B: The "Headliner" Method (Cool Waveforms)**
1.  Go to [Headliner.app](https://make.headliner.app/).
2.  Upload your audio.
3.  It auto-generates a video with a moving waveform (looks very professional).

### Phase 3: Hosting
1.  **Upload**: Upload your new MP4s to YouTube (Unlisted) or Mux.
2.  **Get Link**: Copy the `https://www.youtube.com/embed/VIDEO_ID` link.
3.  **Update App**: Paste these links into your `apps/web-members/app/training/basic/modules.ts` file.

## Other Video Tools
If you want something other than the "Podcast" style:
*   **Synthesia / HeyGen**: Type text, get an AI Avatar talking. Professional but costs money.
*   **Loom**: Record your own screen while talking through a slide deck. Authentic and free.
*   **Descript**: Edit video by editing text. Great for fixing mistakes.

**Recommendation**: Start with **NotebookLM**. It's free, immediate, and the "Deep Dive" format is incredibly engaging for students compared to boring lectures.
