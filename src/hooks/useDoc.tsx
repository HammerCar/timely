import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase";

export default function useDoc<T>(path: string) {
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let destructed = false;
    const fetchData = async () => {
      const paths = path.split("/");

      if (paths.length === 0 || paths.length % 2 !== 0) {
        return;
      }

      const querySnapshot = await getDoc(doc(db, paths[0], ...paths.slice(1)));
      const data = querySnapshot.data();

      if (destructed) {
        return;
      }

      if (data === undefined) {
        setError(true);
        return;
      }

      setData(data as T);
      setError(false);
    };

    fetchData();

    return () => {
      destructed = true;
    };
  }, [path]);

  return { data, error };
}
