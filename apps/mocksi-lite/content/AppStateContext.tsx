import { type Dispatch, createContext, useEffect, useReducer } from "react";
import { MOCKSI_RECORDING_STATE } from "../consts";

export enum AppState {
	INIT = "INIT",
	UNAUTHORIZED = "UNAUTHORIZED",
	READY = "READY",
	RECORDING = "RECORDING",
	ANALYZING = "ANALYZING",
	CREATE = "CREATE",
	EDITING = "EDITING",
	PLAY = "PLAY",
	HIDDEN = "HIDDEN",
	CHAT = "CHAT",
}

export enum AppEvent {
	SET_INITIAL_STATE = "SET_INITIAL_STATE",
	START_RECORDING = "START_RECORDING",
	STOP_RECORDING = "STOP_RECORDING",
	STOP_ANALYZING = "STOP_ANALYZING",
	START_EDITING = "START_EDITING",
	CANCEL_EDITING = "CANCEL_EDITING",
	SAVE_MODIFICATIONS = "SAVE_MODIFICATIONS",
	START_PLAYING = "START_PLAYING",
	STOP_PLAYING = "STOP_PLAYING",
	START_CHAT = "START_CHAT",
	CREATE_DEMO = "CREATE_DEMO",
}

export const INITIAL_STATE = AppState.INIT;

type AppStateContextType = {
	state: AppState;
	dispatch: Dispatch<AppStateAction>;
};

type AppStateAction = {
	event: AppEvent;
	payload?: AppState;
};

export const AppStateContext = createContext<AppStateContextType>({
	state: INITIAL_STATE,
	dispatch: () => null,
});

const appStateReducer = (state: AppState, action: AppStateAction) => {
	switch (action.event) {
		case AppEvent.SET_INITIAL_STATE:
			return action.payload ?? AppState.CREATE;
		case AppEvent.START_RECORDING:
			return AppState.RECORDING;
		case AppEvent.STOP_RECORDING:
			return AppState.ANALYZING;
		case AppEvent.STOP_ANALYZING:
			return AppState.CREATE;
		case AppEvent.START_EDITING:
			return AppState.EDITING;
		case AppEvent.CANCEL_EDITING:
			return AppState.CREATE;
		case AppEvent.SAVE_MODIFICATIONS:
			return AppState.CREATE;
		case AppEvent.START_PLAYING:
			return AppState.PLAY;
		case AppEvent.STOP_PLAYING:
			return AppState.CREATE;
		case AppEvent.START_CHAT:
			return AppState.CHAT;
		case AppEvent.CREATE_DEMO:
			return AppState.READY;
		default:
			return state;
	}
};

/**
 * Wraps the reducer and takes the state change and saves it to chrome local storage
 * @param reducer the app state reducer that we want to use to calc the next state
 * @returns the next app state
 */
const localStorageMiddleware = (reducer: typeof appStateReducer) => {
	return (state: AppState, action: AppStateAction) => {
		const newState = reducer(state, action);

		console.log(state, action.event, newState);

		chrome.storage.local.set({ [MOCKSI_RECORDING_STATE]: newState });

		return newState;
	};
};

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const reducer = localStorageMiddleware(appStateReducer);
	const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

	// Load the initial state from chrome storage on mount
	useEffect(() => {
		chrome.storage.local.get([MOCKSI_RECORDING_STATE], (result) => {
			dispatch({
				event: AppEvent.SET_INITIAL_STATE,
				payload: result[MOCKSI_RECORDING_STATE],
			});
		});
	}, []);

	const value = {
		state,
		dispatch,
	};

	return (
		<AppStateContext.Provider value={value}>
			{children}
		</AppStateContext.Provider>
	);
};
