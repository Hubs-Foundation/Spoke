import React, { useCallback, useState } from "react";
import styled from "styled-components";
import NavBar from "../navigation/NavBar";
import Footer from "../navigation/Footer";
import FileInput from "../inputs/FileInput";
import ProgressBar from "../inputs/ProgressBar";
import KitPackager from "../../editor/kits/KitPackager";

const Container = styled.div`
  display: flex;
  margin: auto;
  max-width: 800px;
  justify-content: center;
  flex-direction: column;

  h1 {
    font-size: 3em;
    margin-bottom: 20px;
  }

  span {
    padding-bottom: 12px;
  }

  > div {
    text-align: center;
    margin-bottom: 12px;
  }
`;

export default function PackageKitPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState(null);

  const onUpload = useCallback(async files => {
    setIsGenerating(true);

    const kitPackager = new KitPackager();

    try {
      const file = files[0];
      const fileUrl = URL.createObjectURL(file);
      const kitName = file.name.replace(".glb", "");
      const zipBlob = await kitPackager.package(kitName, fileUrl, setMessage);

      const el = document.createElement("a");
      const fileName = kitName + ".zip";
      el.download = fileName;
      el.href = URL.createObjectURL(zipBlob);
      document.body.appendChild(el);
      el.click();
      document.body.removeChild(el);

      setMessage(`Downloading ${fileName}`);
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return (
    <>
      <NavBar />
      <main>
        <Container>
          <h1>Kit Packager</h1>
          {message && <div>{message}</div>}
          {isGenerating ? (
            <ProgressBar />
          ) : (
            <FileInput label="Upload Kit (.glb)" accept=".glb,model/gltf-binary" onChange={onUpload} />
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
