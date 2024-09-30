import "./index.css";
import CardV2 from "../CardV2";
import SearchBar from "../SearchBar";
import { Loading } from "../Loading";
import { Helmet } from "react-helmet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FetchList from "../../utils/api";
import pinyin from "pinyin-match";
import { isLogin } from "../../utils/check";
import { generateSearchEngineCard } from "../../utils/serachEngine";
import { toggleJumpTarget } from "../../utils/setting";

const mutiSearch = (s, t) => {
  const source = (s as string).toLowerCase();
  const target = t.toLowerCase();
  const rawInclude = source.includes(target);
  const pinYinInlcude = Boolean(pinyin.match(source, target));
  return rawInclude || pinYinInlcude;
};

const Content = (props: any) => {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [searchString, setSearchString] = useState("");
  const [val, setVal] = useState("");

  const filteredDataRef = useRef<any>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const r = await FetchList();
      setData(r);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetSearch = () => {
    setVal("");
    setSearchString("");
  };

  const handleSetSearch = (val: string) => {
    if (val !== "" && val) {
      setSearchString(val.trim());
    } else {
      resetSearch();
    }
  };

  const filteredData = useMemo(() => {
    if (data.tools) {
      const localResult = data.tools
        .filter((item: any) => {
          const hide = item.hide;
          if (!hide) return true;
          if (hide && isLogin()) return false;
          return false;
        })
        .filter((item: any) => {
          if (searchString === "") {
            return true;
          }
          return (
            mutiSearch(item.name, searchString) ||
            mutiSearch(item.desc, searchString) ||
            mutiSearch(item.url, searchString)
          );
        });
      return [...localResult, ...generateSearchEngineCard(searchString)];
    } else {
      return [...generateSearchEngineCard(searchString)];
    }
  }, [data, searchString]);

  useEffect(() => {
    filteredDataRef.current = filteredData;
  }, [filteredData]);

  useEffect(() => {
    if (searchString.trim() === "") {
      document.removeEventListener("keydown", onKeyEnter);
    } else {
      document.addEventListener("keydown", onKeyEnter);
    }
    return () => {
      document.removeEventListener("keydown", onKeyEnter);
    };
  }, [searchString]);

  const renderCardsV2 = useCallback(() => {
    return filteredData.map((item, index) => {
      return (
        <CardV2
          title={item.name}
          url={item.url}
          des={item.desc}
          logo={item.logo}
          key={item.id}
          index={index}
          isSearching={searchString.trim() !== ""}
          onClick={() => {
            resetSearch();
            if (item.url === "toggleJumpTarget") {
              toggleJumpTarget();
              loadData();
            }
          }}
        />
      );
    });
  }, [filteredData, searchString]);

  const onKeyEnter = (ev: KeyboardEvent) => {
    const cards = filteredDataRef.current;
    if (ev.keyCode === 13) {
      if (cards && cards.length) {
        window.open(cards[0]?.url, "_blank");
        resetSearch();
      }
    }
    if (ev.ctrlKey || ev.metaKey) {
      const num = Number(ev.key);
      if (isNaN(num)) return;
      ev.preventDefault();
      const index = Number(ev.key) - 1;
      if (index >= 0 && index < cards.length) {
        window.open(cards[index]?.url, "_blank");
        resetSearch();
      }
    }
  };

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <link
          rel="icon"
          href={
            data?.setting?.favicon ?? "favicon.ico"
          }
        />
        <title>{data?.setting?.title ?? "Van Nav"}</title>
      </Helmet>
      <div className="topbar">
        <div className="content">
          <SearchBar
            searchString={val}
            setSearchText={(t) => {
              setVal(t);
              handleSetSearch(t);
            }}
          />
        </div>
      </div>
      <div className="content-wraper">
        <div className="content cards">
          {loading ? <Loading></Loading> : renderCardsV2()}
        </div>
      </div>
      <div className="record-wraper">
        <a href="https://beian.miit.gov.cn" target="_blank" rel="noreferrer">{data?.setting?.govRecord ?? ""}</a>
      </div>
    </>
  );
};

export default Content;
