import { RouteComponentProps } from "react-router-dom";

import { AppRouteProps } from "../../containers/App/app";
import { GetExpGqlProps } from "../../graphql/get-exp.query";
import { GetExpEntriesGqlProps } from "../../graphql/exp-entries.query";
import { ExpRouteParams } from "../../Routing";

export type OwnProps = AppRouteProps & RouteComponentProps<ExpRouteParams>;

export type Props = OwnProps & GetExpGqlProps & GetExpEntriesGqlProps;

export type FormObjVal = Date | string;
export type FormObj = { [k: string]: FormObjVal };

export interface FieldComponentProps {
  name: string;
  setValue: (formName: string, value: FormObjVal) => void;
}