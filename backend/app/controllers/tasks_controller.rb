class TasksController < ApplicationController
    before_action :set_task, only: [:show, :update, :destroy]
  
    def index
      @tasks = Task.all
      render json: @tasks
    end
  
    def show
      render json: @task
    end
  
    def create
      @task = Task.new(task_params)
      @task.user = current_user
  
      if @task.save
        render json: @task, status: :created
      else
        render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
      end
    end
  
    def update
      if @task.update(task_params)
        render json: @task, status: :ok
      else
        render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
      end
    end
  
    def destroy
      @task.destroy
      head :no_content
    end
  
    private

    def set_task
      @task = Task.find(params[:id]) # IDでタスクを検索
    rescue ActiveRecord::RecordNotFound # 該当するタスクが存在しない場合は例外をキャッチ
        render json: { errors: ["Task not found"]}, status: :not_found # JSON形式でエラーレスポンスを返し、HTTPステーステータスを404にする
    end

    def task_params
      params.require(:task).permit(:title, :status, :user_id)
    end
end