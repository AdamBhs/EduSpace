import { SelectMenu } from "@/shared/components/SelectMenu";
import TabSwitch from "./ui/TabSwitch";
import CardTodo from "./components/CardTodo";

const Todo = () => {
  return (
    <div className="max-w-250">
      <div className="flex justify-between">
        <SelectMenu
          label="class"
          data={["All Classes", "class 1", "class 2"]}
          autoSelect={true}
        />

        <TabSwitch />
      </div>

      <CardTodo />

      <CardTodo />

      <CardTodo />
    </div>
  );
};

export default Todo;
