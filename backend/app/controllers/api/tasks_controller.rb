module Api
  class TasksController < ApplicationController
    before_action :authenticate_api_user!, only: [:create, :update, :destroy]
    before_action :set_task, only: [:show, :update, :destroy]
    
    def index
      tasks = Task.all
      render json: tasks.select(:id, :title, :status, :progress, :deadline, :parent_id, :depth, :description)
    end
    

    # GET /api/tasks/priority
    # 上位5件の優先タスク（完了除外）を返す
    def priority
      tasks = Task.priority_order
      render json: tasks.select(:id, :title, :status, :progress, :deadline, :parent_id, :depth, :description)
    end

    def show
        render json: @task
    end

    def create
      @task = current_api_user.tasks.new(task_params)
      # depth は before_validation で自動設定
      if @task.save
        render json: @task.as_tree, status: :created
      else
        render json:{ errors: @task.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      task = Task.find(params[:id])
      if task.update(task_params)
        render json: task
      else
        render json: { errors: task.errors.full_messages }, status: :unprocessable_entity
      end
    rescue ArgumentError => e  # enum不一致など
      render json: { errors: [e.message] }, status: :unprocessable_entity
    rescue ActionController::ParameterMissing => e
      render json: { errors: [e.message] }, status: :unprocessable_entity
    end
    

    def destroy
        @task.destroy
        head :no_content
    end

    private

    def set_task
        @task = Task.find_by(id: params[:id])
        render json: { errors: ["Task not found"] }, status: :not_found unless @task
    end

    def task_params
      params.require(:task).permit(:title, :status, :progress, :deadline, :parent_id, :depth)
    end    
  end
end