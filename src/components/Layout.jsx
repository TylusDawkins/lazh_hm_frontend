import Nav from "@components/Nav";
import Recorder from "@components/Recorder";

export default function Layout(props) {

  return <>
  <Nav/>
  <Recorder/>
  {props.children}
  </>;
}