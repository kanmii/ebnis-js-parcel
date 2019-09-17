import React, {
  useEffect,
  useContext,
  useReducer,
  useMemo,
  useRef,
  useCallback,
} from "react";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import "./my-experiences.styles.scss";
import {
  Props,
  ExperienceProps,
  mapSavedExperiencesToIds,
  DispatchProvider,
  reducer,
  dispatchContext,
  ActionTypes,
  initState,
  SearchResults,
  StateMachine,
} from "./my-experiences.utils";
import { EXPERIENCE_DEFINITION_URL } from "../../routes";
import { makeExperienceRoute } from "../../constants/experience-route";
import { Loading } from "../Loading/loading";
import { SidebarHeader } from "../SidebarHeader/sidebar-header.component";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { MY_EXPERIENCES_TITLE } from "../../constants/my-experiences-title";
import { Link } from "gatsby";
import {
  ExperienceConnectionFragment,
  ExperienceConnectionFragment_edges,
  ExperienceConnectionFragment_edges_node,
} from "../../graphql/apollo-types/ExperienceConnectionFragment";
import {
  LayoutUnchangingContext,
  LayoutActionType,
  LayoutContextExperience,
} from "../Layout/layout.utils";
import { ExperienceMiniFragment } from "../../graphql/apollo-types/ExperienceMiniFragment";
import SemanticSearch from "semantic-ui-react/dist/commonjs/modules/Search";
import { SearchResultProps, SearchProps } from "semantic-ui-react";
import { NavigateFn } from "@reach/router";
import lodashDebounce from "lodash/debounce";
import {
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables,
} from "../../graphql/apollo-types/GetExperienceConnectionMini";
import { GET_EXPERIENCES_MINI_QUERY } from "../../graphql/get-experience-connection-mini.query";
import { useQuery } from "@apollo/react-hooks";
import {
  searchDebounceTimeoutMs,
  cleanUpOnSearchExit,
} from "./my-experiences.injectables";

export const MyExperiences = (props: Props) => {
  const { data, loading } = useQuery<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >(GET_EXPERIENCES_MINI_QUERY, {
    variables: {
      input: {
        pagination: {
          first: 2000,
        },
      },
    },
  });

  const getExperiences = data && data.getExperiences;

  const experiences = useMemo(() => {
    if (!getExperiences) {
      return [];
    }

    return (getExperiences.edges as ExperienceConnectionFragment_edges[]).map(
      edge => edge.node as ExperienceConnectionFragment_edges_node,
    );
  }, [getExperiences]);

  const [stateMachine, dispatch] = useReducer(
    reducer,
    { experiences },
    initState,
  );

  const {
    context: { descriptionMap },
    states,
  } = stateMachine;

  const { layoutDispatch } = useContext(LayoutUnchangingContext);
  const { fetchExperience } = useContext(LayoutContextExperience);

  useEffect(() => {
    setDocumentTitle(makeSiteTitle(MY_EXPERIENCES_TITLE));

    return setDocumentTitle;
  }, []);

  useEffect(() => {
    if (!getExperiences || fetchExperience !== "never-fetched") {
      return;
    }

    setTimeout(() => {
      const ids = mapSavedExperiencesToIds(
        getExperiences as ExperienceConnectionFragment,
      );

      if (ids.length === 0) {
        return;
      }

      layoutDispatch({
        type: LayoutActionType.EXPERIENCES_TO_PREFETCH,
        ids,
      });
    }, 1000);
  }, [getExperiences, layoutDispatch]);

  function renderExperiences() {
    if (experiences.length === 0) {
      return (
        <Link
          to={EXPERIENCE_DEFINITION_URL}
          className="no-experiences-info"
          id="no-experiences-info"
        >
          Click here to create your first experience
        </Link>
      );
    }

    return (
      <div id="experiences-container" className="experiences-container">
        <SearchComponent {...states.search} />

        {experiences.map(experience => {
          const { id } = experience;

          return (
            <Experience
              key={id}
              showingDescription={descriptionMap[id]}
              experience={experience}
            />
          );
        })}
      </div>
    );
  }

  function renderMain() {
    if (loading) {
      return <Loading loading={loading} />;
    }

    if (!getExperiences) {
      return <div id="no-experiences-error">Error loading experiences</div>;
    }

    return (
      <>
        {renderExperiences()}

        <Link
          className="new-experience-button"
          id="new-experience-button"
          to={EXPERIENCE_DEFINITION_URL}
        >
          +
        </Link>
      </>
    );
  }

  return (
    <div className="components-experiences">
      <SidebarHeader title="My Experiences" sidebar={true} />

      <DispatchProvider
        value={{
          dispatch,
          navigate: props.navigate as NavigateFn,
          searchDebounceTimeoutMs: searchDebounceTimeoutMs,
          cleanUpOnSearchExit: cleanUpOnSearchExit,
        }}
      >
        <div className="main">{renderMain()}</div>
      </DispatchProvider>
    </div>
  );
};

export default MyExperiences;

const Experience = React.memo(
  function ExperienceFn({ showingDescription, experience }: ExperienceProps) {
    const { title, description, id } = experience;

    return (
      <div className="exp-container">
        <ShowDescriptionToggle
          showingDescription={showingDescription}
          experience={experience}
        />

        <Link
          className="exp-container-main"
          to={makeExperienceRoute(id)}
          id={`experience-main-${id}`}
        >
          <span className="experience-title" id={`experience-title-${id}`}>
            {title}
          </span>

          {showingDescription && (
            <div
              className="experience-description"
              id={`experience-description-${id}`}
            >
              {description}
            </div>
          )}
        </Link>
      </div>
    );
  },

  function ExperienceDiff(prevProps, currProps) {
    return prevProps.showingDescription === currProps.showingDescription;
  },
);

const ShowDescriptionToggle = React.memo(
  function ShowDescriptionToggleFn({
    showingDescription,
    experience: { id, description },
  }: {
    experience: ExperienceMiniFragment;
    showingDescription: boolean;
  }) {
    const { dispatch } = useContext(dispatchContext);

    if (!description) {
      return null;
    }

    const props = {
      className: "reveal-hide-description",

      id: `experience-description-toggle-${id}`,

      onClick: () =>
        dispatch({
          type: ActionTypes.TOGGLE_DESCRIPTION,
          id,
        }),
    };

    return showingDescription ? (
      <Icon name="caret down" {...props} />
    ) : (
      <Icon name="caret right" {...props} />
    );
  },

  function ShowDescriptionToggleDiff(oldProps, newProps) {
    return oldProps.showingDescription === newProps.showingDescription;
  },
);

const defaultSearchActiveContext = {
  searchText: "",
  results: [],
} as SearchResults["results"]["context"];

const searchResultRenderer = (props: SearchResultProps) => {
  const { price: experienceId, title } = props;
  return (
    <div className="search-result" id={`search-result-${experienceId}`}>
      {title}
    </div>
  );
};

function SearchComponent(props: StateMachine["states"]["search"]) {
  const {
    dispatch,
    navigate,
    searchDebounceTimeoutMs,
    cleanUpOnSearchExit,
  } = useContext(dispatchContext);
  const activeSearch =
    (props as SearchResults).results || ({} as SearchResults["results"]);

  const searchFn = useCallback(
    (_, { value }: SearchProps) => {
      dispatch({
        type: ActionTypes.SEARCH_STARTED,
      });

      const searchText = value as string;

      setTimeout(() => {
        dispatch({
          type: ActionTypes.SEARCH_TEXT_SET,
          searchText,
        });
      });
    },
    [dispatch],
  );

  const searchFnDebouncedRef = useRef(
    lodashDebounce(searchFn, searchDebounceTimeoutMs, {
      leading: true,
    }),
  );

  const { context = defaultSearchActiveContext } = activeSearch;

  useEffect(() => {
    const debounced = searchFnDebouncedRef.current;

    return () => {
      cleanUpOnSearchExit(debounced);
    };
  }, [cleanUpOnSearchExit]);

  return (
    <SemanticSearch
      id="my-experiences-search"
      value={context.searchText}
      className="my-search"
      loading={props.value === "searching"}
      results={context.results}
      resultRenderer={searchResultRenderer}
      onSearchChange={searchFnDebouncedRef.current}
      onResultSelect={(_, { result }) => {
        const { price: experienceId } = result;
        navigate(makeExperienceRoute(experienceId));
      }}
    />
  );
}
